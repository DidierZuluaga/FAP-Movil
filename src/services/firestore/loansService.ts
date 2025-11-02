import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loan, Payment } from '../../types';

class LoansService {
  private loansCollection = 'loans';
  private paymentsCollection = 'payments';

  // Crear solicitud de préstamo
  async createLoan(
    userId: string,
    amount: number,
    term: number,
    description: string,
    rate: number,
    codeudorId?: string
  ): Promise<string> {
    try {
      console.log('📝 Creando préstamo:', { userId, amount, term, rate });
      
      // Calcular cuota mensual usando fórmula de amortización
      const monthlyRate = rate / 100 / 12;
      const monthlyPayment = Math.round(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
          (Math.pow(1 + monthlyRate, term) - 1)
      );

      console.log('💰 Cuota mensual calculada:', monthlyPayment);

      const loanData = {
        userId,
        codeudorId: codeudorId || null,
        amount,
        balance: amount,
        term,
        interestRate: rate,
        monthlyPayment,
        description,
        status: 'pendiente',
        codeudorStatus: codeudorId ? 'pending' : null,
        requestDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('📤 Enviando a Firestore:', loanData);

      const docRef = await addDoc(collection(db, this.loansCollection), loanData);
      
      console.log('✅ Préstamo creado con ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('❌ Error al crear préstamo:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      throw new Error(`No se pudo solicitar el préstamo: ${error.message}`);
    }
  }

  // Obtener préstamos de un usuario
  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      console.log('🔍 Buscando préstamos para userId:', userId);
      
      // Intentar con orderBy
      try {
        const q = query(
          collection(db, this.loansCollection),
          where('userId', '==', userId),
          orderBy('requestDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return this.processLoansSnapshot(querySnapshot);
      } catch (orderError: any) {
        // Si falla por índice, intentar sin orderBy
        if (orderError.code === 'failed-precondition') {
          console.log('⚠️ Intentando sin orderBy...');
          const q = query(
            collection(db, this.loansCollection),
            where('userId', '==', userId)
          );
          
          const querySnapshot = await getDocs(q);
          const loans = this.processLoansSnapshot(querySnapshot);
          
          // Ordenar manualmente
          loans.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
          return loans;
        }
        throw orderError;
      }
    } catch (error: any) {
      console.error('❌ Error al obtener préstamos:', error);
      return [];
    }
  }

  private processLoansSnapshot(querySnapshot: any): Loan[] {
    const loans: Loan[] = [];
    
    console.log('📊 Préstamos encontrados:', querySnapshot.size);

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      loans.push({
        id: doc.id,
        userId: data.userId,
        codeudorId: data.codeudorId,
        amount: data.amount,
        balance: data.balance,
        term: data.term,
        interestRate: data.interestRate,
        monthlyPayment: data.monthlyPayment,
        status: data.status,
        description: data.description,
        requestDate: data.requestDate.toDate(),
        approvalDate: data.approvalDate?.toDate(),
        codeudorStatus: data.codeudorStatus,
        documentsURL: data.documentsURL,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Loan);
    });

    return loans;
  }

  // Registrar abono/pago
  async registerPayment(
    loanId: string,
    userId: string,
    amount: number,
    receiptURL?: string
  ): Promise<string> {
    try {
      console.log('💵 Registrando pago:', { loanId, userId, amount });
      
      // Obtener préstamo actual
      const loanRef = doc(db, this.loansCollection, loanId);
      const loanSnap = await getDoc(loanRef);

      if (!loanSnap.exists()) {
        throw new Error('Préstamo no encontrado');
      }

      const loanData = loanSnap.data();
      const currentBalance = loanData.balance;
      const newBalance = Math.max(0, currentBalance - amount);

      console.log('💰 Balance actual:', currentBalance, '→ Nuevo:', newBalance);

      // Crear registro de pago
      const paymentData = {
        loanId,
        userId,
        amount,
        date: Timestamp.now(),
        newBalance,
        receiptURL: receiptURL || null,
        status: 'confirmado',
        createdAt: Timestamp.now(),
      };

      const paymentRef = await addDoc(
        collection(db, this.paymentsCollection),
        paymentData
      );

      // Actualizar saldo del préstamo
      const updateData: any = {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      };

      // Si el saldo llega a 0, marcar como pagado
      if (newBalance === 0) {
        updateData.status = 'pagado';
      }

      await updateDoc(loanRef, updateData);

      console.log('✅ Pago registrado con ID:', paymentRef.id);
      return paymentRef.id;
    } catch (error: any) {
      console.error('❌ Error al registrar pago:', error);
      throw new Error(`No se pudo registrar el abono: ${error.message}`);
    }
  }

  // Obtener historial de pagos de un préstamo
  async getLoanPayments(loanId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, this.paymentsCollection),
        where('loanId', '==', loanId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const payments: Payment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          loanId: data.loanId,
          userId: data.userId,
          amount: data.amount,
          date: data.date.toDate(),
          newBalance: data.newBalance,
          receiptURL: data.receiptURL,
          status: data.status,
          createdAt: data.createdAt.toDate(),
        });
      });

      return payments;
    } catch (error: any) {
      console.error('Error al obtener pagos:', error);
      return [];
    }
  }

  // Actualizar estado del préstamo (admin)
  async updateLoanStatus(
    loanId: string, 
    status: 'pendiente' | 'aprobado' | 'rechazado' | 'activo' | 'pagado'
  ): Promise<void> {
    try {
      const loanRef = doc(db, this.loansCollection, loanId);
      
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'aprobado' || status === 'activo') {
        updateData.approvalDate = Timestamp.now();
      }

      await updateDoc(loanRef, updateData);
      
      console.log('✅ Estado del préstamo actualizado');
    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      throw new Error('No se pudo actualizar el estado del préstamo.');
    }
  }

  // Obtener préstamos activos de un usuario
  async getActiveLoans(userId: string): Promise<Loan[]> {
    try {
      const allLoans = await this.getUserLoans(userId);
      return allLoans.filter(
        loan => loan.status === 'activo' || loan.status === 'aprobado'
      );
    } catch (error: any) {
      console.error('Error al obtener préstamos activos:', error);
      return [];
    }
  }

  // Calcular próxima fecha de pago (aproximada)
  getNextPaymentDate(loan: Loan): Date {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 6);
    return nextMonth;
  }
}

export const loansService = new LoansService();
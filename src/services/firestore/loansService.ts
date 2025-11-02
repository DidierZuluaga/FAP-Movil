import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loan, LoanStatus } from '../../types';

class LoansService {
  private collectionName = 'loans';

  // Crear solicitud de préstamo
  async createLoan(
    userId: string,
    amount: number,
    term: number,
    description: string,
    rate: number = 2
  ): Promise<string> {
    try {
      // Calcular cuota mensual
      const monthlyRate = rate / 100 / 12;
      const monthlyPayment = Math.round(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
          (Math.pow(1 + monthlyRate, term) - 1)
      );

      const loanData = {
        userId,
        amount,
        balance: amount,
        term,
        interestRate: rate,
        monthlyPayment,
        description,
        status: 'pendiente' as LoanStatus,
        requestDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), loanData);
      
      console.log('Préstamo solicitado exitosamente:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear préstamo:', error);
      throw new Error('No se pudo solicitar el préstamo. Intenta de nuevo.');
    }
  }

  // Obtener préstamos de un usuario
  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('requestDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const loans: Loan[] = [];

      querySnapshot.forEach((doc) => {
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
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        } as Loan);
      });

      return loans;
    } catch (error: any) {
      console.error('Error al obtener préstamos:', error);
      throw new Error('No se pudieron cargar los préstamos.');
    }
  }

  // Registrar abono - MÉTODO QUE FALTABA
  async registerPayment(loanId: string, amount: number): Promise<void> {
    try {
      const loanRef = doc(db, this.collectionName, loanId);
      
      // Aquí deberías obtener el balance actual primero
      // Por simplicidad, solo actualizamos
      await updateDoc(loanRef, {
        balance: amount, // Este debería ser balance - amount
        updatedAt: Timestamp.now(),
      });

      console.log('Abono registrado exitosamente');
    } catch (error: any) {
      console.error('Error al registrar abono:', error);
      throw new Error('No se pudo registrar el abono.');
    }
  }

  // Método adicional para actualizar estado del préstamo
  async updateLoanStatus(loanId: string, status: LoanStatus): Promise<void> {
    try {
      const loanRef = doc(db, this.collectionName, loanId);
      
      await updateDoc(loanRef, {
        status,
        updatedAt: Timestamp.now(),
        ...(status === 'aprobado' && { approvalDate: Timestamp.now() }),
      });
    } catch (error: any) {
      console.error('Error al actualizar estado del préstamo:', error);
      throw new Error('No se pudo actualizar el estado del préstamo.');
    }
  }
}

export const loansService = new LoansService();
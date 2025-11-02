import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Saving } from '../../types';

class SavingsService {
  private collectionName = 'savings';

  async createSaving(
    userId: string,
    amount: number,
    description: string,
    date: Date = new Date()
  ): Promise<string> {
    try {
      const savingData = {
        userId,
        amount,
        description,
        date: Timestamp.fromDate(date),
        status: 'confirmado', // CAMBIO: era 'confirmed', ahora 'confirmado'
        createdAt: Timestamp.now(),
        synced: true,
      };

      const docRef = await addDoc(collection(db, this.collectionName), savingData);
      console.log('✅ Aporte creado con ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('❌ Error al crear aporte:', error);
      console.error('Detalles del error:', error.code, error.message);
      throw new Error('No se pudo registrar el aporte');
    }
  }

  async getUserSavings(userId: string): Promise<Saving[]> {
    try {
      console.log('🔍 Buscando ahorros para userId:', userId);
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const savings: Saving[] = [];

      console.log('📊 Documentos encontrados:', querySnapshot.size);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Documento:', doc.id, data);
        
        savings.push({
          id: doc.id,
          userId: data.userId,
          amount: data.amount,
          description: data.description,
          date: data.date.toDate(),
          receiptURL: data.receiptURL,
          signatureURL: data.signatureURL,
          accumulatedBalance: data.accumulatedBalance || 0,
          status: data.status || 'confirmado',
          createdAt: data.createdAt.toDate(),
          synced: data.synced || true,
        });
      });

      console.log('✅ Total ahorros cargados:', savings.length);
      return savings;
    } catch (error: any) {
      console.error('❌ Error al obtener ahorros:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      
      // Si el error es por falta de índice, intentar sin orderBy
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Intentando sin orderBy...');
        try {
          const q = query(
            collection(db, this.collectionName),
            where('userId', '==', userId)
          );
          
          const querySnapshot = await getDocs(q);
          const savings: Saving[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            savings.push({
              id: doc.id,
              userId: data.userId,
              amount: data.amount,
              description: data.description,
              date: data.date.toDate(),
              receiptURL: data.receiptURL,
              signatureURL: data.signatureURL,
              accumulatedBalance: data.accumulatedBalance || 0,
              status: data.status || 'confirmado',
              createdAt: data.createdAt.toDate(),
              synced: data.synced || true,
            });
          });
          
          // Ordenar manualmente por fecha
          savings.sort((a, b) => b.date.getTime() - a.date.getTime());
          
          return savings;
        } catch (retryError) {
          console.error('❌ Error en reintento:', retryError);
          return [];
        }
      }
      
      return [];
    }
  }

  async getTotalBalance(userId: string): Promise<number> {
    try {
      const savings = await this.getUserSavings(userId);
      const total = savings.reduce((sum, saving) => sum + saving.amount, 0);
      console.log('💰 Balance total calculado:', total);
      return total;
    } catch (error) {
      console.error('Error calculando balance:', error);
      return 0;
    }
  }

  async calculateInterests(userId: string, rate: number = 0.085): Promise<number> {
    try {
      const totalBalance = await this.getTotalBalance(userId);
      const interests = Math.round(totalBalance * rate);
      console.log('📈 Intereses calculados:', interests);
      return interests;
    } catch (error) {
      console.error('Error calculando intereses:', error);
      return 0;
    }
  }
}

export const savingsService = new SavingsService();
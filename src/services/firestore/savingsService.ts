// src/services/firestore/savingsService.ts
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
        status: 'confirmed',
        createdAt: Timestamp.now(),
        synced: true,
      };

      const docRef = await addDoc(collection(db, this.collectionName), savingData);
      console.log('Aporte creado:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear aporte:', error);
      throw new Error('No se pudo registrar el aporte');
    }
  }

  async getUserSavings(userId: string): Promise<Saving[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('date', 'desc')
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
          status: data.status,
          createdAt: data.createdAt.toDate(),
          synced: data.synced || true,
        });
      });

      return savings;
    } catch (error: any) {
      console.error('Error al obtener ahorros:', error);
      return [];
    }
  }

  async getTotalBalance(userId: string): Promise<number> {
    try {
      const savings = await this.getUserSavings(userId);
      return savings.reduce((total, saving) => total + saving.amount, 0);
    } catch (error) {
      return 0;
    }
  }

  async calculateInterests(userId: string, rate: number = 0.05): Promise<number> {
    try {
      const totalBalance = await this.getTotalBalance(userId);
      return Math.round(totalBalance * rate);
    } catch (error) {
      return 0;
    }
  }
}

export const savingsService = new SavingsService();
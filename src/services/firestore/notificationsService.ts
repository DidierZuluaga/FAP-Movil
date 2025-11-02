import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export type NotificationType = 
  | 'loan_approved' 
  | 'loan_rejected' 
  | 'payment_reminder' 
  | 'meeting_reminder' 
  | 'saving_confirmed'
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

class NotificationsService {
  private collectionName = 'notifications';

  // Crear notificación
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<string> {
    try {
      const notificationData = {
        userId,
        type,
        title,
        message,
        actionUrl,
        read: false,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        notificationData
      );

      return docRef.id;
    } catch (error: any) {
      console.error('Error creando notificación:', error);
      throw new Error('No se pudo crear la notificación');
    }
  }

  // Obtener notificaciones de un usuario
  async getUserNotifications(userId: string, maxResults: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: data.read,
          actionUrl: data.actionUrl,
          createdAt: data.createdAt.toDate(),
        });
      });

      return notifications;
    } catch (error: any) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  // Contar notificaciones no leídas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error contando notificaciones:', error);
      return 0;
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error: any) {
      console.error('Error marcando notificación como leída:', error);
      throw new Error('No se pudo actualizar la notificación');
    }
  }

  // Marcar todas como leídas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map((document) =>
        updateDoc(doc(db, this.collectionName, document.id), { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('Error marcando todas como leídas:', error);
      throw new Error('No se pudieron actualizar las notificaciones');
    }
  }

  // Crear notificación automática de aporte
  async notifySavingConfirmed(userId: string, amount: number): Promise<void> {
    await this.createNotification(
      userId,
      'saving_confirmed',
      '✅ Aporte Confirmado',
      `Tu aporte de ${this.formatCurrency(amount)} ha sido registrado exitosamente.`
    );
  }

  // Helper para formatear moneda
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Crear notificación de préstamo aprobado
  async notifyLoanApproved(userId: string, amount: number): Promise<void> {
    await this.createNotification(
      userId,
      'loan_approved',
      '🎉 Préstamo Aprobado',
      `Tu solicitud de préstamo por $${amount.toLocaleString('es-CO')} ha sido aprobada.`,
      '/loans'
    );
  }

  // Crear notificación de préstamo rechazado
  async notifyLoanRejected(userId: string): Promise<void> {
    await this.createNotification(
      userId,
      'loan_rejected',
      '❌ Préstamo Rechazado',
      'Lamentablemente tu solicitud de préstamo no fue aprobada. Contacta al administrador para más información.',
      '/loans'
    );
  }

  // Crear recordatorio de pago
  async notifyPaymentReminder(userId: string, amount: number, dueDate: Date): Promise<void> {
    await this.createNotification(
      userId,
      'payment_reminder',
      '💰 Recordatorio de Pago',
      `Tienes un pago pendiente de $${amount.toLocaleString('es-CO')} con vencimiento el ${dueDate.toLocaleDateString('es-CO')}.`,
      '/loans'
    );
  }
}

export const notificationsService = new NotificationsService();
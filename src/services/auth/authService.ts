import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { User, UserRole } from '../../types/index';

class AuthService {
  // Listener de cambios de autenticación
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser.uid);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Registro con email y contraseña - VERSIÓN CORREGIDA
  async registerWithEmail(
    email: string,
    password: string,
    name: string,
    dateOfBirth: Date,
    role: UserRole = 'asociado'
  ): Promise<User> {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Actualizar perfil con nombre
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Preparar datos del usuario - SIN photoURL si es undefined
      const userData: any = {
        email,
        name,
        role,
        dateOfBirth: Timestamp.fromDate(dateOfBirth),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Solo agregar photoURL si existe
      if (userCredential.user.photoURL) {
        userData.photoURL = userCredential.user.photoURL;
      }

      // Crear documento en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Retornar usuario con datos correctos
      return {
        id: userCredential.user.uid,
        email,
        name,
        dateOfBirth,
        role,
        photoURL: userCredential.user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error en registerWithEmail:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login con email y contraseña
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = await this.getUserData(userCredential.user.uid);
      if (!user) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      return user;
    } catch (error: any) {
      console.error('Error en loginWithEmail:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login con Google - VERSIÓN SIMPLIFICADA
  async loginWithGoogle(): Promise<User> {
    throw new Error(
      'Login con Google estará disponible próximamente. Por favor usa email y contraseña.'
    );
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Recuperar contraseña
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Actualizar perfil
  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Solo agregar campos que no sean undefined
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.photoURL !== undefined) updateData.photoURL = updates.photoURL;
      if (updates.role !== undefined) updateData.role = updates.role;
      
      // Convertir dateOfBirth a Timestamp si existe
      if (updates.dateOfBirth) {
        updateData.dateOfBirth = Timestamp.fromDate(updates.dateOfBirth);
      }

      await updateDoc(userRef, updateData);

      // Actualizar también en Firebase Auth si es necesario
      if (auth.currentUser) {
        const authUpdates: any = {};
        if (updates.name) authUpdates.displayName = updates.name;
        if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
        
        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(auth.currentUser, authUpdates);
        }
      }
    } catch (error: any) {
      console.error('Error en updateUserProfile:', error);
      throw this.handleAuthError(error);
    }
  }

  // Obtener datos del usuario desde Firestore
  async getUserData(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('Usuario no existe en Firestore:', userId);
        return null;
      }

      const data = userDoc.data();
      
      return {
        id: userDoc.id,
        email: data.email,
        name: data.name,
        photoURL: data.photoURL || undefined,
        role: data.role,
        dateOfBirth: data.dateOfBirth.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } catch (error: any) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Verificar si un email ya está registrado
  async isEmailRegistered(email: string): Promise<boolean> {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return false;
      }
      return false;
    }
  }

  // Manejo de errores de autenticación
  private handleAuthError(error: any): Error {
    let message = 'Ha ocurrido un error';

    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Correo electrónico inválido';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operación no permitida';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/user-not-found':
        message = 'No existe una cuenta con este correo';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      case 'auth/invalid-credential':
        message = 'Credenciales inválidas. Verifica tu correo y contraseña';
        break;
      case 'auth/invalid-login-credentials':
        message = 'Correo o contraseña incorrectos';
        break;
      default:
        message = error.message || 'Error de autenticación';
    }

    return new Error(message);
  }
}

export const authService = new AuthService();
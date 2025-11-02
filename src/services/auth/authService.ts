import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { User } from '../../types';

class AuthService {
  // Registrar con email
  async registerWithEmail(
    email: string,
    password: string,
    name: string,
    dateOfBirth: Date,
    role: 'asociado' | 'cliente' = 'asociado'
  ): Promise<User> {
    try {
      console.log('📝 Iniciando registro:', { email, name, role });
      
      // Validar contraseña ANTES de enviar a Firebase
      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Validar edad (mayor de 18)
      const age = this.calculateAge(dateOfBirth);
      if (age < 18) {
        throw new Error('Debes ser mayor de 18 años para registrarte');
      }

      console.log('✅ Validaciones pasadas, creando usuario en Firebase Auth...');

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('✅ Usuario creado en Auth:', userCredential.user.uid);

      // Actualizar perfil en Auth
      await firebaseUpdateProfile(userCredential.user, {
        displayName: name,
      });

      console.log('✅ Perfil actualizado en Auth');

      // Crear documento en Firestore
      const userData: Omit<User, 'id'> = {
        email,
        name,
        role,
        dateOfBirth,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('📤 Guardando en Firestore:', userData);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        dateOfBirth: Timestamp.fromDate(dateOfBirth),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Usuario guardado en Firestore');

      return {
        id: userCredential.user.uid,
        ...userData,
      };
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      
      // Mensajes de error más claros en español
      let errorMessage = 'Error al registrar usuario';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo ya está registrado. Inicia sesión en su lugar.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'El registro con email/contraseña no está habilitado.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
          break;
        case 'permission-denied':
          errorMessage = 'No tienes permisos para crear esta cuenta. Verifica las reglas de Firestore.';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      throw new Error(errorMessage);
    }
  }

  // Iniciar sesión con email
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Iniciando sesión:', email);

      // Validar que la contraseña tenga al menos 6 caracteres
      if (password.length < 6) {
        throw new Error('La contraseña es incorrecta');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('✅ Autenticación exitosa:', userCredential.user.uid);

      // Obtener datos de Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        console.error('❌ Usuario no encontrado en Firestore');
        throw new Error('Usuario no encontrado en la base de datos');
      }

      const userData = userDoc.data();
      console.log('✅ Datos de usuario obtenidos');

      return {
        id: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        role: userData.role,
        dateOfBirth: userData.dateOfBirth.toDate(),
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      };
    } catch (error: any) {
      console.error('❌ Error en login:', error);

      let errorMessage = 'Error al iniciar sesión';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo. Regístrate primero.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'La contraseña es incorrecta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Correo o contraseña incorrectos.';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      throw new Error(errorMessage);
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      console.log('👋 Cerrando sesión...');
      await signOut(auth);
      console.log('✅ Sesión cerrada');
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      throw new Error('No se pudo cerrar sesión');
    }
  }

  // Listener de cambios de autenticación
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          console.log('👤 Usuario autenticado:', firebaseUser.uid);
          
          // Obtener datos de Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            callback({
              id: firebaseUser.uid,
              email: userData.email,
              name: userData.name,
              photoURL: userData.photoURL,
              role: userData.role,
              dateOfBirth: userData.dateOfBirth.toDate(),
              createdAt: userData.createdAt.toDate(),
              updatedAt: userData.updatedAt.toDate(),
            });
          } else {
            console.warn('⚠️ Usuario en Auth pero no en Firestore');
            callback(null);
          }
        } catch (error) {
          console.error('❌ Error obteniendo datos de usuario:', error);
          callback(null);
        }
      } else {
        console.log('👋 Usuario no autenticado');
        callback(null);
      }
    });
  }

  // Enviar correo de restablecimiento de contraseña
  async sendPasswordReset(email: string): Promise<void> {
    try {
      console.log('📧 Enviando correo de restablecimiento a:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Correo enviado');
    } catch (error: any) {
      console.error('❌ Error enviando correo:', error);

      let errorMessage = 'Error al enviar correo de restablecimiento';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      throw new Error(errorMessage);
    }
  }

  // Actualizar perfil de usuario
  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
  ): Promise<void> {
    try {
      console.log('✏️ Actualizando perfil:', userId);
      
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Convertir Date a Timestamp
      if (updates.dateOfBirth) {
        updateData.dateOfBirth = Timestamp.fromDate(updates.dateOfBirth);
      }

      await updateDoc(userRef, updateData);

      console.log('✅ Perfil actualizado');

      // Actualizar también en Firebase Auth si cambia el nombre
      if (updates.name && auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updates.name,
        });
      }
    } catch (error: any) {
      console.error('❌ Error actualizando perfil:', error);
      throw new Error('No se pudo actualizar el perfil');
    }
  }

  // Calcular edad
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Iniciar sesión con Google (ya implementado)
  async loginWithGoogle(): Promise<User> {
    throw new Error('Google sign-in debe implementarse en el cliente');
  }
}

export const authService = new AuthService();
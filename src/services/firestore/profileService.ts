import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

class ProfileService {
  private usersCollection = 'users';

  // Tomar foto con la cámara - CORREGIDO PARA WEB
  async takePhoto(): Promise<string | null> {
    try {
      console.log('📸 Iniciando toma de foto...');

      if (Platform.OS === 'web') {
        // EN WEB: Usar API de cámara directamente
        return await this.takePhotoWeb();
      }

      // EN MÓVIL: Usar expo-image-picker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Se requieren permisos de cámara');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) {
        return null;
      }

      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    } catch (error: any) {
      console.error('❌ Error tomando foto:', error);
      
      // En web, si falla la cámara, usar selector de archivos
      if (Platform.OS === 'web') {
        console.log('🔄 Fallback a selector de archivos para cámara');
        return await this.pickImageWeb();
      }
      
      throw new Error(`No se pudo tomar la foto: ${error.message}`);
    }
  }

  // Cámara para WEB usando getUserMedia - CÓDIGO CORREGIDO
  private async takePhotoWeb(): Promise<string | null> {
    return new Promise((resolve) => {
      // Verificar si el navegador soporta la API de cámara
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('📱 Navegador no soporta cámara, usando selector de archivos');
        this.pickImageWeb().then(resolve);
        return;
      }

      // Crear video element para la cámara
      const video = document.createElement('video');
      video.style.display = 'none';
      video.autoplay = true;

      // Crear canvas para capturar foto
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      const ctx = canvas.getContext('2d');

      // Crear contenedor modal para la cámara
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.zIndex = '10000';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';

      // Video preview
      const preview = document.createElement('video');
      preview.style.width = '400px';
      preview.style.height = '400px';
      preview.style.objectFit = 'cover';
      preview.style.borderRadius = '10px';
      preview.autoplay = true;

      // Botones
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';

      const captureButton = document.createElement('button');
      captureButton.textContent = '📸 Tomar Foto';
      captureButton.style.padding = '10px 20px';
      captureButton.style.backgroundColor = '#007bff';
      captureButton.style.color = 'white';
      captureButton.style.border = 'none';
      captureButton.style.borderRadius = '5px';
      captureButton.style.cursor = 'pointer';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = '❌ Cancelar';
      cancelButton.style.padding = '10px 20px';
      cancelButton.style.backgroundColor = '#dc3545';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '5px';
      cancelButton.style.cursor = 'pointer';

      let mediaStream: MediaStream | null = null;

      // Acción de capturar foto
      captureButton.onclick = () => {
        if (!ctx) {
          console.error('No se pudo obtener el contexto del canvas');
          return;
        }

        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        ctx.drawImage(preview, 0, 0);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Detener streams y limpiar
        if (mediaStream) {
          mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        document.body.removeChild(modal);
        
        resolve(photoDataUrl);
      };

      // Acción de cancelar
      cancelButton.onclick = () => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        document.body.removeChild(modal);
        resolve(null);
      };

      // Ensamblar modal
      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      modal.appendChild(preview);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);

      // Acceder a la cámara
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 800 },
          height: { ideal: 800 }
        } 
      })
      .then(stream => {
        mediaStream = stream;
        preview.srcObject = stream;
        video.srcObject = stream;
      })
      .catch(error => {
        console.error('Error accediendo a la cámara:', error);
        document.body.removeChild(modal);
        // Fallback a selector de archivos
        this.pickImageWeb().then(resolve);
      });
    });
  }

  // Seleccionar foto de galería
  async pickImage(): Promise<string | null> {
    try {
      console.log('🖼️ Iniciando selección de imagen...');

      if (Platform.OS === 'web') {
        return await this.pickImageWeb();
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Se requieren permisos de galería');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) {
        return null;
      }

      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    } catch (error: any) {
      console.error('❌ Error seleccionando imagen:', error);
      throw new Error(`No se pudo seleccionar la imagen: ${error.message}`);
    }
  }

  // Selector de archivos para web
  private async pickImageWeb(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';

      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const base64 = await this.fileToBase64(file);
          resolve(base64);
        } catch (error) {
          console.error('Error convirtiendo archivo:', error);
          resolve(null);
        }
        
        document.body.removeChild(input);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  // Convertir archivo a Base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Cambiar foto de perfil
  async changeProfilePhoto(userId: string, source: 'camera' | 'gallery'): Promise<string> {
    try {
      console.log('📸 Cambiando foto de perfil con fuente:', source);

      const imageBase64 = source === 'camera' 
        ? await this.takePhoto()
        : await this.pickImage();

      if (!imageBase64) {
        throw new Error('No se seleccionó ninguna imagen');
      }

      console.log('✅ Imagen obtenida correctamente');
      return imageBase64;
      
    } catch (error: any) {
      console.error('❌ Error cambiando foto de perfil:', error);
      
      // Fallback a avatar
      console.log('🔄 Usando avatar como fallback');
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}_${Date.now()}&backgroundColor=2563eb`;
    }
  }

  // Actualizar perfil de usuario
  async updateUserProfile(userId: string, updates: any): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw new Error('No se pudo actualizar el perfil');
    }
  }

  // Obtener perfil de usuario
  async getUserProfile(userId: string): Promise<any> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: userSnap.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          photoURL: data.photoURL,
          monthlyContribution: data.monthlyContribution || 0,
          phone: data.phone || '',
          birthDate: data.birthDate?.toDate?.(),
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }
    // === MÉTODOS NUEVOS PARA APORTE MENSUAL ===
  
  // Método específico para el aporte mensual
  async updateMonthlyContribution(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      await updateDoc(userRef, {
        monthlyContribution: amount,
        updatedAt: new Date(),
      });
      console.log('✅ Aporte mensual actualizado:', amount);
    } catch (error: any) {
      console.error('Error actualizando aporte mensual:', error);
      throw new Error('No se pudo actualizar el aporte mensual');
    }
  }

  // Obtener solo el aporte mensual
  async getMonthlyContribution(userId: string): Promise<number> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return data.monthlyContribution || 0;
      }
      return 0;
    } catch (error: any) {
      console.error('Error obteniendo aporte mensual:', error);
      return 0;
    }
  }
}

export const profileService = new ProfileService();
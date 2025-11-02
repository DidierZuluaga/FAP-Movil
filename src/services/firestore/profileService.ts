import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import { Platform } from 'react-native';

class ProfileService {
  // Solicitar permisos de cámara
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  // Solicitar permisos de galería
  async requestMediaLibraryPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // Tomar foto con la cámara
  async takePhoto(): Promise<string | null> {
    try {
      console.log('📸 Solicitando permisos de cámara...');
      
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Se requieren permisos de cámara');
      }

      console.log('✅ Permisos concedidos, abriendo cámara...');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('📷 Resultado cámara:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('✅ Foto capturada:', result.assets[0].uri);
        return result.assets[0].uri;
      }

      console.log('❌ Usuario canceló la captura');
      return null;
    } catch (error: any) {
      console.error('❌ Error tomando foto:', error);
      throw new Error(`No se pudo tomar la foto: ${error.message}`);
    }
  }

  // Seleccionar foto de la galería
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        throw new Error('Se requieren permisos de galería');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      throw new Error('No se pudo seleccionar la imagen');
    }
  }

  // Subir imagen a Firebase Storage
  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('📤 Subiendo foto desde URI:', imageUri);
      
      // Convertir URI a Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      console.log('📦 Blob creado, tamaño:', blob.size);

      // Crear referencia en Storage
      const filename = `profile_${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profiles/${userId}/${filename}`);

      console.log('📁 Referencia creada:', `profiles/${userId}/${filename}`);

      // Subir imagen con metadata
      const metadata = {
        contentType: 'image/jpeg',
      };
      
      await uploadBytes(storageRef, blob, metadata);

      console.log('✅ Imagen subida a Storage');

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      console.log('✅ URL de descarga obtenida:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error subiendo foto:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      throw new Error(`No se pudo subir la foto: ${error.message}`);
    }
  }

  // Actualizar foto de perfil en Firestore
  async updateProfilePhoto(userId: string, photoURL: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoURL,
        updatedAt: new Date(),
      });

      console.log('✅ Foto de perfil actualizada');
    } catch (error) {
      console.error('❌ Error actualizando foto de perfil:', error);
      throw new Error('No se pudo actualizar la foto de perfil');
    }
  }

  // Actualizar información de perfil
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      dateOfBirth?: Date;
      phone?: string;
    }
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      await updateDoc(userRef, updateData);

      console.log('✅ Perfil actualizado');
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      throw new Error('No se pudo actualizar el perfil');
    }
  }

  // Proceso completo: elegir origen, subir y actualizar
  async changeProfilePhoto(
    userId: string,
    source: 'camera' | 'gallery'
  ): Promise<string> {
    try {
      // Obtener imagen según fuente
      const imageUri = source === 'camera'
        ? await this.takePhoto()
        : await this.pickImage();

      if (!imageUri) {
        throw new Error('No se seleccionó ninguna imagen');
      }

      // Subir a Storage
      const photoURL = await this.uploadProfilePhoto(userId, imageUri);

      // Actualizar en Firestore
      await this.updateProfilePhoto(userId, photoURL);

      return photoURL;
    } catch (error: any) {
      console.error('Error cambiando foto de perfil:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
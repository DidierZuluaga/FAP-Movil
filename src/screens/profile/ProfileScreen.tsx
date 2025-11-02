import { Platform } from 'react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  ChevronRight,
  Camera,
  Bell,
  Lock,
  HelpCircle,
  FileText,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../config/theme';
import { formatDate } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Para web, usar confirm nativo
      if (window.confirm('¿Estás seguro que deseas salir?')) {
        performLogout();
      }
    } else {
      // Para móvil, usar Alert nativo
      RNAlert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      if (Platform.OS === 'web') {
        alert('Error al cerrar sesión. Intenta de nuevo.');
      } else {
        RNAlert.alert('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    RNAlert.alert(
      'Editar Perfil',
      'Función de edición de perfil próximamente disponible'
    );
  };

  const handleChangePhoto = () => {
    RNAlert.alert(
      'Cambiar Foto',
      'Función de cambio de foto próximamente disponible'
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mi Perfil</Text>

        {/* Foto de perfil */}
        <View style={styles.profilePhotoContainer}>
          <View style={styles.profilePhoto}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.photoImage} />
            ) : (
              <User size={60} color={theme.colors.primary[600]} />
            )}
          </View>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleChangePhoto}
          >
            <Camera size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </LinearGradient>

      {/* Información del usuario */}
      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Correo Electrónico</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
              <Text style={styles.infoValue}>
                {user?.dateOfBirth
                  ? formatDate(user.dateOfBirth, 'dd/MM/yyyy')
                  : 'No especificada'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Shield size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>
                {user?.role ? ROLE_LABELS[user.role] : 'No especificado'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Miembro desde</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt
                  ? formatDate(user.createdAt, 'MMMM yyyy')
                  : 'No disponible'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Botón editar perfil */}
        <Button
          title="Editar Perfil"
          onPress={handleEditProfile}
          variant="outline"
          fullWidth
          style={styles.editButton}
        />

        {/* Opciones */}
        <Text style={styles.sectionTitle}>Configuración</Text>

        <Card style={styles.optionsCard}>
          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <Bell size={20} color={theme.colors.gray[600]} />
              <Text style={styles.optionText}>Notificaciones</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <Lock size={20} color={theme.colors.gray[600]} />
              <Text style={styles.optionText}>Seguridad y Privacidad</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <HelpCircle size={20} color={theme.colors.gray[600]} />
              <Text style={styles.optionText}>Ayuda y Soporte</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <FileText size={20} color={theme.colors.gray[600]} />
              <Text style={styles.optionText}>Términos y Condiciones</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>
        </Card>

        {/* Botón cerrar sesión */}
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          fullWidth
          loading={isLoggingOut}
          icon={<LogOut size={20} color={theme.colors.white} />}
          style={styles.logoutButton}
        />

        {/* Versión */}
        <Text style={styles.version}>Versión 1.0.0</Text>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xl,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing.lg,
  },
  infoCard: {
    padding: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: theme.spacing.md,
  },
  editButton: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  optionsCard: {
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[900],
    fontWeight: theme.fontWeight.medium,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
  },
  version: {
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.lg,
  },
  bottomSpacing: {
    height: 40,
  },
});
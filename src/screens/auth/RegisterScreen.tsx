import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  User as UserIcon,
  Calendar,
  Shield,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../config/theme';

export const RegisterScreen = ({ navigation }: any) => {
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    role: 'asociado' as 'asociado' | 'cliente',
  });

  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  // Validar formulario
  const validateForm = () => {
    const newErrors: any = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Debe contener al menos una mayúscula';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Debe contener al menos un número';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar fecha de nacimiento
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const age = Math.floor(
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Fecha no válida';
      } else if (age < 18) {
        newErrors.dateOfBirth = 'Debes ser mayor de 18 años';
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Fecha no válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar registro
  const handleRegister = async () => {
    if (!validateForm()) {
      // Mostrar el primer error
      const firstError = Object.values(errors)[0];
      if (Platform.OS === 'web') {
        alert(`❌ ${firstError}`);
      } else {
        Alert.alert('Error', firstError as string);
      }
      return;
    }

    try {
      console.log('📝 Iniciando registro con datos:', {
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        role: formData.role,
      });

      await register(
        formData.email,
        formData.password,
        formData.name,
        new Date(formData.dateOfBirth)
      );

      console.log('✅ Registro exitoso');

      // Mensaje de éxito
      if (Platform.OS === 'web') {
        alert('✅ Cuenta creada exitosamente. Ya puedes iniciar sesión.');
      } else {
        Alert.alert(
          'Éxito',
          'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
          [{ text: 'OK' }]
        );
      }

      // Navegar al login
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      
      if (Platform.OS === 'web') {
        alert(`❌ ${error.message || 'Error al crear la cuenta'}`);
      } else {
        Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
      }
    }
  };

  // Formatear fecha para input (YYYY-MM-DD)
  const handleDateChange = (text: string) => {
    // Permitir solo números y guiones
    let formatted = text.replace(/[^0-9-]/g, '');
    
    // Auto-formatear mientras escribe
    if (formatted.length === 4 && !formatted.includes('-')) {
      formatted += '-';
    } else if (formatted.length === 7 && formatted.split('-').length === 2) {
      formatted += '-';
    }
    
    // Limitar a 10 caracteres (YYYY-MM-DD)
    formatted = formatted.slice(0, 10);
    
    setFormData({ ...formData, dateOfBirth: formatted });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a FAP Móvil y gestiona tus finanzas
          </Text>
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.form}>
          <Input
            label="Nombre Completo"
            placeholder="Ej: Juan Pérez"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            error={errors.name}
            leftIcon={<UserIcon size={20} color={theme.colors.gray[400]} />}
            autoCapitalize="words"
          />

          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text.trim() })}
            error={errors.email}
            leftIcon={<Mail size={20} color={theme.colors.gray[400]} />}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Fecha de Nacimiento"
            placeholder="YYYY-MM-DD (Ej: 2000-01-15)"
            value={formData.dateOfBirth}
            onChangeText={handleDateChange}
            error={errors.dateOfBirth}
            leftIcon={<Calendar size={20} color={theme.colors.gray[400]} />}
            keyboardType="numeric"
            hint="Formato: Año-Mes-Día"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            error={errors.password}
            leftIcon={<Lock size={20} color={theme.colors.gray[400]} />}
            secureTextEntry
            hint="Debe tener al menos 8 caracteres, 1 mayúscula y 1 número"
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            error={errors.confirmPassword}
            leftIcon={<Lock size={20} color={theme.colors.gray[400]} />}
            secureTextEntry
          />

          {/* Selector de rol */}
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Tipo de Usuario</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'asociado' && styles.roleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'asociado' })}
              >
                <Shield
                  size={20}
                  color={
                    formData.role === 'asociado'
                      ? theme.colors.white
                      : theme.colors.primary[600]
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'asociado' && styles.roleButtonTextActive,
                  ]}
                >
                  Asociado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'cliente' && styles.roleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'cliente' })}
              >
                <UserIcon
                  size={20}
                  color={
                    formData.role === 'cliente'
                      ? theme.colors.white
                      : theme.colors.primary[600]
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'cliente' && styles.roleButtonTextActive,
                  ]}
                >
                  Cliente
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de registro */}
          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          {/* Link a Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  form: {
    padding: theme.spacing.lg,
  },
  roleSelector: {
    marginBottom: theme.spacing.lg,
  },
  roleLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    backgroundColor: theme.colors.white,
    gap: theme.spacing.sm,
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  roleButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  roleButtonTextActive: {
    color: theme.colors.white,
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  loginLink: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
});
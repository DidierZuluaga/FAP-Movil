import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Calendar, ChevronLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateAge } from '../../utils/validators';
import { theme } from '../../config/theme';
import { formatDate } from '../../utils/formatters';

export const RegisterScreen = ({ navigation }: any) => {
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: new Date(2000, 0, 1), // Fecha por defecto hace 24 años
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El correo es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Correo inválido';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!validateAge(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Debes ser mayor de 18 años para registrarte';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.dateOfBirth
      );
      // La navegación se maneja automáticamente
    } catch (error) {
      // El error ya está en el store
      console.error('Error en registro:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // En Android, el picker se cierra automáticamente
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setFormData({ ...formData, dateOfBirth: selectedDate });
      // Limpiar error de fecha si existe
      if (errors.dateOfBirth) {
        setErrors({ ...errors, dateOfBirth: undefined });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
          <Text style={styles.headerSubtitle}>
            Únete a FAP Móvil y comienza a ahorrar
          </Text>
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {error && <Alert variant="error" message={error} />}
          {errors.terms && <Alert variant="warning" message={errors.terms} />}

          <Input
            label="Nombre Completo"
            placeholder="Juan Pérez"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            error={errors.name}
            leftIcon={<User size={20} color={theme.colors.gray[400]} />}
            autoCapitalize="words"
          />

          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon={<Mail size={20} color={theme.colors.gray[400]} />}
          />

          {/* DatePicker personalizado */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateButton,
                errors.dateOfBirth && styles.dateButtonError
              ]}
            >
              <Calendar size={20} color={theme.colors.gray[400]} />
              <Text style={styles.dateButtonText}>
                {formatDate(formData.dateOfBirth, 'dd/MM/yyyy')}
              </Text>
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
            <Text style={styles.hint}>Debes ser mayor de 18 años</Text>
          </View>

          {/* DatePicker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()} // No permitir fechas futuras
              minimumDate={new Date(1940, 0, 1)} // Edad mínima realista
              textColor={theme.colors.gray[900]}
            />
          )}

          {/* Botón para cerrar DatePicker en iOS */}
          {showDatePicker && Platform.OS === 'ios' && (
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            error={errors.password}
            leftIcon={<Lock size={20} color={theme.colors.gray[400]} />}
            hint="Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números"
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            secureTextEntry
            error={errors.confirmPassword}
            leftIcon={<Lock size={20} color={theme.colors.gray[400]} />}
          />

          {/* Términos y condiciones */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              acceptedTerms && styles.checkboxChecked
            ]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Acepto los{' '}
              <Text style={styles.termsLink}>términos y condiciones</Text>
              {' '}y la{' '}
              <Text style={styles.termsLink}>política de privacidad</Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
          />

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
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
    backgroundColor: theme.colors.white,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
  },
  dateButtonError: {
    borderColor: theme.colors.error[500],
    borderWidth: 2,
  },
  dateButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[700],
    flex: 1,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  datePickerButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  datePickerButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[600],
    marginTop: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.gray[400],
    borderRadius: 6,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
  },
  termsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  loginLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },
});
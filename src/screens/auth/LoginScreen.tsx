import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';
import { theme } from '../../config/theme';

export const LoginScreen = ({ navigation }: any) => {
  const { login, loginWithGoogle, isLoading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'El correo es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Correo inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login(email, password);
      // La navegación se maneja automáticamente por el estado de autenticación
    } catch (error) {
      // El error ya está en el store
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      // El error ya está en el store
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
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>💰</Text>
            </View>
            <Text style={styles.appName}>FAP Móvil</Text>
            <Text style={styles.tagline}>Fondo en tu Bolsillo</Text>
          </View>
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Accede a tu cuenta para gestionar tus ahorros y préstamos
          </Text>

          {error && (
            <Alert
              variant="error"
              message={error}
            />
          )}

          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon={<Mail size={20} color={theme.colors.gray[400]} />}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            leftIcon={<Lock size={20} color={theme.colors.gray[400]} />}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continuar con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <Button
            title="Google"
            onPress={handleGoogleLogin}
            variant="outline"
            fullWidth
            icon={
              <Image
                source={require('../../../assets/google-icon.png')}
                style={styles.googleIcon}
              />
            }
          />

          {/* Registro */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  registerLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },
});
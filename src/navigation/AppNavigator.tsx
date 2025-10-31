import { ProfileScreen } from '../screens/profile/ProfileScreen';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, DollarSign, CreditCard, PieChart, User } from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { theme } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// Placeholder Screens (temporales)
// ==========================================

const DashboardScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderEmoji}>🏠</Text>
    <Text style={styles.placeholderTitle}>Dashboard</Text>
    <Text style={styles.placeholderText}>
      Aquí verás tu resumen financiero con gráficos y estadísticas
    </Text>
  </View>
);

const SavingsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderEmoji}>💰</Text>
    <Text style={styles.placeholderTitle}>Ahorros</Text>
    <Text style={styles.placeholderText}>
      Registra tus aportes y consulta tu saldo acumulado
    </Text>
  </View>
);

const LoansScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderEmoji}>💳</Text>
    <Text style={styles.placeholderTitle}>Préstamos</Text>
    <Text style={styles.placeholderText}>
      Solicita préstamos y gestiona tus abonos
    </Text>
  </View>
);

const ReportsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderEmoji}>📊</Text>
    <Text style={styles.placeholderTitle}>Reportes</Text>
    <Text style={styles.placeholderText}>
      Visualiza estadísticas y exporta reportes
    </Text>
  </View>
);

// ==========================================
// Navegación por pestañas (Bottom Tabs)
// ==========================================

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.gray[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Savings"
        component={SavingsScreen}
        options={{
          tabBarLabel: 'Ahorros',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          tabBarLabel: 'Préstamos',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reportes',
          tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// ==========================================
// Navegador principal de la aplicación
// ==========================================

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar pantalla de carga mientras verificamos autenticación
  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Usuario autenticado - Mostrar app principal
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // Usuario NO autenticado - Mostrar pantallas de auth
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ==========================================
// Estilos para pantallas placeholder
// ==========================================

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
  },
  placeholderEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  placeholderTitle: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});
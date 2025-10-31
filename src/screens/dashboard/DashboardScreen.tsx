import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  User,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { theme } from '../../config/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValues] = useState({
    balance: new Animated.Value(0),
    cards: new Animated.Value(0),
    notifications: new Animated.Value(0),
  });

  // Datos de ejemplo (esto vendrá de Firebase después)
  const dashboardData = {
    balance: 5250000,
    interests: 125000,
    activeLoans: 1,
    nextMeetings: 2,
    monthlyContribution: 500000,
    recentTransactions: [
      {
        id: '1',
        type: 'saving',
        amount: 500000,
        description: 'Aporte mensual',
        date: new Date(),
      },
      {
        id: '2',
        type: 'interest',
        amount: 25000,
        description: 'Intereses generados',
        date: new Date(Date.now() - 86400000),
      },
      {
        id: '3',
        type: 'loan_payment',
        amount: -169500,
        description: 'Cuota préstamo',
        date: new Date(Date.now() - 172800000),
      },
    ],
    savingsGrowth: 8.5, // Porcentaje de crecimiento
  };

  useEffect(() => {
    // Animaciones de entrada
    Animated.stagger(150, [
      Animated.spring(animatedValues.balance, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(animatedValues.cards, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(animatedValues.notifications, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Aquí cargarías datos reales desde Firebase
    setTimeout(() => setRefreshing(false), 1500);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary[600]}
        />
      }
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Usuario'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color={theme.colors.white} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <User size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance principal animado */}
        <Animated.View
          style={[
            styles.balanceCard,
            {
              opacity: animatedValues.balance,
              transform: [
                {
                  translateY: animatedValues.balance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  scale: animatedValues.balance,
                },
              ],
            },
          ]}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo Total</Text>
            <View style={styles.growthBadge}>
              <TrendingUp size={14} color={theme.colors.success[600]} />
              <Text style={styles.growthText}>+{dashboardData.savingsGrowth}%</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>
            {formatCurrency(dashboardData.balance)}
          </Text>
          <Text style={styles.interestsText}>
            Intereses: {formatCurrency(dashboardData.interests)}
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Tarjetas de estadísticas */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: animatedValues.cards,
            transform: [
              {
                translateY: animatedValues.cards.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary[100] }]}>
              <DollarSign size={24} color={theme.colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(dashboardData.monthlyContribution)}
            </Text>
            <Text style={styles.statLabel}>Aporte Mensual</Text>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: theme.colors.error[100] }]}>
              <CreditCard size={24} color={theme.colors.error[600]} />
            </View>
            <Text style={styles.statValue}>{dashboardData.activeLoans}</Text>
            <Text style={styles.statLabel}>Préstamo Activo</Text>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: theme.colors.warning[100] }]}>
              <Calendar size={24} color={theme.colors.warning[600]} />
            </View>
            <Text style={styles.statValue}>{dashboardData.nextMeetings}</Text>
            <Text style={styles.statLabel}>Próximas Reuniones</Text>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success[100] }]}>
              <TrendingUp size={24} color={theme.colors.success[600]} />
            </View>
            <Text style={styles.statValue}>+{dashboardData.savingsGrowth}%</Text>
            <Text style={styles.statLabel}>Crecimiento</Text>
          </Card>
        </View>
      </Animated.View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.success[500] }]}
            onPress={() => navigation.navigate('Savings')}
          >
            <Plus size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Aportar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => navigation.navigate('Loans')}
          >
            <CreditCard size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Préstamo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary[500] }]}
            onPress={() => navigation.navigate('Reports')}
          >
            <TrendingUp size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Reportes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Movimientos recientes */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: animatedValues.notifications,
            transform: [
              {
                translateY: animatedValues.notifications.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {dashboardData.recentTransactions.map((transaction) => (
          <Card key={transaction.id} style={styles.transactionCard} variant="outlined">
            <View style={styles.transactionContent}>
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor:
                      transaction.amount > 0
                        ? theme.colors.success[100]
                        : theme.colors.error[100],
                  },
                ]}
              >
                {transaction.amount > 0 ? (
                  <ArrowDownRight
                    size={20}
                    color={theme.colors.success[600]}
                  />
                ) : (
                  <ArrowUpRight size={20} color={theme.colors.error[600]} />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date, 'dd MMM yyyy')}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      transaction.amount > 0
                        ? theme.colors.success[600]
                        : theme.colors.error[600],
                  },
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}
                {formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>
          </Card>
        ))}
      </Animated.View>

      {/* Espaciado inferior */}
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error[500],
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  growthText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[600],
    fontWeight: theme.fontWeight.semibold,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  interestsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  statsContainer: {
    marginTop: -70,
    paddingHorizontal: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
  },
  seeAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  transactionCard: {
    marginBottom: theme.spacing.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[900],
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  transactionAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  bottomSpacing: {
    height: 100,
  },
   headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
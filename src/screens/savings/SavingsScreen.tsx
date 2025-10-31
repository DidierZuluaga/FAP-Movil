import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  Plus,
  TrendingUp,
  ArrowDownRight,
  Calendar,
  Search,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../config/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SavingsScreen = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Datos de ejemplo
  const savingsData = {
    totalBalance: 5250000,
    monthlyContribution: 500000,
    totalInterests: 125000,
    growth: 8.5,
    transactions: [
      {
        id: '1',
        amount: 500000,
        description: 'Aporte mensual Octubre',
        date: new Date(),
        status: 'confirmed',
      },
      {
        id: '2',
        amount: 25000,
        description: 'Intereses generados',
        date: new Date(Date.now() - 86400000),
        status: 'confirmed',
      },
      {
        id: '3',
        amount: 500000,
        description: 'Aporte mensual Septiembre',
        date: new Date(Date.now() - 2592000000),
        status: 'confirmed',
      },
      {
        id: '4',
        amount: 500000,
        description: 'Aporte mensual Agosto',
        date: new Date(Date.now() - 5184000000),
        status: 'confirmed',
      },
    ],
  };

  const handleAddSaving = () => {
    Alert.alert(
      '💰 Registrar Aporte',
      'Funcionalidad completa próximamente. Podrás:\n\n• Ingresar monto\n• Adjuntar comprobante\n• Firma digital\n• Guardado automático',
      [{ text: 'Entendido' }]
    );
  };

  const filteredTransactions = savingsData.transactions.filter((t) =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.success[600], theme.colors.success[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mis Ahorros</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Total Acumulado</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(savingsData.totalBalance)}
          </Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Intereses</Text>
              <Text style={styles.balanceItemValue}>
                {formatCurrency(savingsData.totalInterests)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Crecimiento</Text>
              <View style={styles.growthContainer}>
                <TrendingUp size={16} color={theme.colors.white} />
                <Text style={styles.balanceItemValue}>
                  +{savingsData.growth}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard} variant="elevated">
          <View style={styles.statIcon}>
            <DollarSign size={24} color={theme.colors.success[600]} />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(savingsData.monthlyContribution)}
          </Text>
          <Text style={styles.statLabel}>Aporte Mensual</Text>
        </Card>

        <Card style={styles.statCard} variant="elevated">
          <View style={[styles.statIcon, { backgroundColor: theme.colors.primary[100] }]}>
            <TrendingUp size={24} color={theme.colors.primary[600]} />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(savingsData.totalInterests)}
          </Text>
          <Text style={styles.statLabel}>Total Intereses</Text>
        </Card>
      </View>

      {/* Add Button */}
      <View style={styles.content}>
        <Button
          title="Registrar Nuevo Aporte"
          onPress={handleAddSaving}
          icon={<Plus size={20} color={theme.colors.white} />}
          fullWidth
        />

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transacciones..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>

        {/* Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Aportes</Text>
          <Text style={styles.transactionCount}>
            {filteredTransactions.length} registros
          </Text>
        </View>

        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} style={styles.transactionCard} variant="outlined">
            <View style={styles.transactionContent}>
              <View style={styles.transactionIcon}>
                <ArrowDownRight size={20} color={theme.colors.success[600]} />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <View style={styles.transactionMeta}>
                  <Calendar size={12} color={theme.colors.gray[500]} />
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date, 'dd MMM yyyy')}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Confirmado</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.transactionAmount}>
                +{formatCurrency(transaction.amount)}
              </Text>
            </View>
          </Card>
        ))}

        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No se encontraron transacciones
            </Text>
          </View>
        )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xl,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: theme.spacing.md,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: -70,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[900],
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
  },
  transactionCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
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
    backgroundColor: theme.colors.success[100],
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
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  statusBadge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[700],
    fontWeight: theme.fontWeight.medium,
  },
  transactionAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success[600],
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[500],
  },
  bottomSpacing: {
    height: 100,
  },
});
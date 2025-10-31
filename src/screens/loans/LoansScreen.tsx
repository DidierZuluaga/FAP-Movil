import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard,
  Plus,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../config/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const LoansScreen = () => {
  // Datos de ejemplo
  const loansData = {
    activeLoans: [
      {
        id: '1',
        amount: 2000000,
        balance: 1500000,
        rate: 2,
        term: 12,
        monthlyPayment: 169500,
        nextPaymentDate: new Date(Date.now() + 432000000),
        status: 'active',
      },
    ],
    loanHistory: [
      {
        id: '2',
        amount: 1000000,
        date: new Date(Date.now() - 15552000000),
        status: 'paid',
      },
    ],
  };

  const handleRequestLoan = () => {
    Alert.alert(
      '💳 Solicitar Préstamo',
      'Funcionalidad completa próximamente. Incluirá:\n\n• Calculadora de cuotas\n• Tabla de amortización\n• Documentos adjuntos\n• Aprobación de codeudor\n• Seguimiento en tiempo real',
      [{ text: 'Entendido' }]
    );
  };

  const handlePayment = () => {
    Alert.alert(
      '💰 Registrar Abono',
      'Funcionalidad completa próximamente. Podrás:\n\n• Registrar abonos\n• Adjuntar comprobante\n• Actualización automática de saldo\n• Historial de pagos',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[600], theme.colors.secondary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Préstamos</Text>
        <Text style={styles.headerSubtitle}>
          Gestiona tus financiamientos y abonos
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Request Loan Button */}
        <Button
          title="Solicitar Nuevo Préstamo"
          onPress={handleRequestLoan}
          icon={<Plus size={20} color={theme.colors.white} />}
          fullWidth
        />

        {/* Active Loans */}
        {loansData.activeLoans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Préstamos Activos</Text>

            {loansData.activeLoans.map((loan) => (
              <Card key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <View>
                    <Text style={styles.loanLabel}>Monto Aprobado</Text>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.amount)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Activo</Text>
                  </View>
                </View>

                <View style={styles.loanStats}>
                  <View style={styles.loanStat}>
                    <Text style={styles.loanStatLabel}>Saldo Pendiente</Text>
                    <Text style={[styles.loanStatValue, { color: theme.colors.error[600] }]}>
                      {formatCurrency(loan.balance)}
                    </Text>
                  </View>

                  <View style={styles.loanStat}>
                    <Text style={styles.loanStatLabel}>Cuota Mensual</Text>
                    <Text style={styles.loanStatValue}>
                      {formatCurrency(loan.monthlyPayment)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${((loan.amount - loan.balance) / loan.amount) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(((loan.amount - loan.balance) / loan.amount) * 100)}% pagado
                  </Text>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.loanDetail}>
                    <Text style={styles.loanDetailLabel}>Plazo</Text>
                    <Text style={styles.loanDetailValue}>{loan.term} meses</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={styles.loanDetailLabel}>Tasa</Text>
                    <Text style={styles.loanDetailValue}>{loan.rate}% anual</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={styles.loanDetailLabel}>Próximo pago</Text>
                    <Text style={styles.loanDetailValue}>
                      {formatDate(loan.nextPaymentDate, 'dd MMM')}
                    </Text>
                  </View>
                </View>

                <Button
                  title="Registrar Abono"
                  onPress={handlePayment}
                  variant="primary"
                  fullWidth
                  icon={<DollarSign size={20} color={theme.colors.white} />}
                />
              </Card>
            ))}
          </>
        )}

        {/* No Active Loans */}
        {loansData.activeLoans.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <CreditCard size={48} color={theme.colors.gray[400]} />
            </View>
            <Text style={styles.emptyTitle}>No tienes préstamos activos</Text>
            <Text style={styles.emptyText}>
              Solicita un préstamo para aprovechar los beneficios del fondo
            </Text>
          </Card>
        )}

        {/* Loan Info */}
        <Card style={styles.infoCard} variant="filled">
          <Text style={styles.infoTitle}>💡 Información sobre Préstamos</Text>
          <View style={styles.infoItem}>
            <CheckCircle size={16} color={theme.colors.success[600]} />
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Asociados:</Text> Tasa de interés del 2% anual
            </Text>
          </View>
          <View style={styles.infoItem}>
            <CheckCircle size={16} color={theme.colors.success[600]} />
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Clientes:</Text> Tasa de interés del 2.5% anual
            </Text>
          </View>
          <View style={styles.infoItem}>
            <CheckCircle size={16} color={theme.colors.success[600]} />
            <Text style={styles.infoText}>
              Clientes requieren un asociado como codeudor
            </Text>
          </View>
        </Card>

        {/* Loan History */}
        {loansData.loanHistory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Historial de Préstamos</Text>

            {loansData.loanHistory.map((loan) => (
              <Card key={loan.id} style={styles.historyCard} variant="outlined">
                <View style={styles.historyContent}>
                  <View style={styles.historyIcon}>
                    <CheckCircle size={20} color={theme.colors.success[600]} />
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyAmount}>
                      {formatCurrency(loan.amount)}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(loan.date, 'dd MMM yyyy')}
                    </Text>
                  </View>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>Pagado</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
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
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  loanCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  loanLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
  },
  statusBadge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[700],
    fontWeight: theme.fontWeight.semibold,
  },
  loanStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  loanStat: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  loanStatLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  loanStatValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success[500],
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    textAlign: 'right',
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  loanDetail: {
    flex: 1,
  },
  loanDetailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    marginBottom: 2,
  },
  loanDetailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  infoCard: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[700],
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: theme.fontWeight.semibold,
  },
  historyCard: {
    marginBottom: theme.spacing.sm,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDetails: {
    flex: 1,
  },
  historyAmount: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: 2,
  },
  historyDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  paidBadge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  paidText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[700],
    fontWeight: theme.fontWeight.semibold,
  },
  bottomSpacing: {
    height: 100,
  },
});
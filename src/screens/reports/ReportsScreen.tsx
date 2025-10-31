import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PieChart,
  Download,
  Share2,
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
} from 'lucide-react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

export const ReportsScreen = () => {
  // Datos de ejemplo
  const reportData = {
    summary: {
      totalSavings: 5250000,
      totalLoans: 1500000,
      totalInterests: 125000,
      transactions: 24,
    },
    monthlyData: [
      { month: 'Jun', amount: 500000 },
      { month: 'Jul', amount: 525000 },
      { month: 'Ago', amount: 500000 },
      { month: 'Sep', amount: 500000 },
      { month: 'Oct', amount: 500000 },
    ],
    distribution: [
      { category: 'Ahorros', amount: 5250000, color: theme.colors.success[500] },
      { category: 'Préstamos', amount: 1500000, color: theme.colors.error[500] },
      { category: 'Intereses', amount: 125000, color: theme.colors.primary[500] },
    ],
  };

  const handleExportPDF = () => {
    Alert.alert(
      '📄 Exportar PDF',
      'Funcionalidad completa próximamente. Generará un reporte profesional con:\n\n• Resumen financiero\n• Gráficos estadísticos\n• Historial de transacciones\n• Logo y formato personalizado',
      [{ text: 'Entendido' }]
    );
  };

  const handleShare = () => {
    Alert.alert(
      '📤 Compartir Reporte',
      'Próximamente podrás compartir tu reporte por:\n\n• WhatsApp\n• Email\n• Telegram\n• Otros',
      [{ text: 'Entendido' }]
    );
  };

  const maxAmount = Math.max(...reportData.monthlyData.map(d => d.amount));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.secondary[600], theme.colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>
          Análisis financiero detallado
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.success[100] }]}>
              <DollarSign size={20} color={theme.colors.success[600]} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportData.summary.totalSavings)}
            </Text>
            <Text style={styles.summaryLabel}>Total Ahorrado</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.error[100] }]}>
              <CreditCard size={20} color={theme.colors.error[600]} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportData.summary.totalLoans)}
            </Text>
            <Text style={styles.summaryLabel}>Préstamos</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.primary[100] }]}>
              <TrendingUp size={20} color={theme.colors.primary[600]} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportData.summary.totalInterests)}
            </Text>
            <Text style={styles.summaryLabel}>Intereses</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.warning[100] }]}>
              <Calendar size={20} color={theme.colors.warning[600]} />
            </View>
            <Text style={styles.summaryValue}>
              {reportData.summary.transactions}
            </Text>
            <Text style={styles.summaryLabel}>Transacciones</Text>
          </Card>
        </View>

        {/* Monthly Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Evolución de Ahorros Mensuales</Text>
          <View style={styles.chart}>
            {reportData.monthlyData.map((item, index) => (
              <View key={index} style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${(item.amount / maxAmount) * 100}%`,
                      backgroundColor: theme.colors.primary[500],
                    },
                  ]}
                >
                  <Text style={styles.barValue}>
                    {(item.amount / 1000).toFixed(0)}k
                  </Text>
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Distribution */}
        <Card style={styles.distributionCard}>
          <Text style={styles.chartTitle}>Distribución Financiera</Text>
          
          {/* Simple pie-like representation */}
          <View style={styles.pieContainer}>
            {reportData.distribution.map((item, index) => {
              const total = reportData.distribution.reduce((sum, i) => sum + i.amount, 0);
              const percentage = (item.amount / total) * 100;
              
              return (
                <View key={index} style={styles.pieItem}>
                  <View style={styles.pieItemHeader}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.pieItemLabel}>{item.category}</Text>
                  </View>
                  <View style={styles.pieItemBar}>
                    <View
                      style={[
                        styles.pieItemFill,
                        { width: `${percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <View style={styles.pieItemFooter}>
                    <Text style={styles.pieItemValue}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.pieItemPercentage}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Export Actions */}
        <View style={styles.actions}>
          <Button
            title="Exportar PDF"
            onPress={handleExportPDF}
            variant="primary"
            style={styles.actionButton}
            icon={<Download size={20} color={theme.colors.white} />}
          />

          <Button
            title="Compartir"
            onPress={handleShare}
            variant="outline"
            style={styles.actionButton}
            icon={<Share2 size={20} color={theme.colors.primary[600]} />}
          />
        </View>

        {/* Info */}
        <Card style={styles.infoCard} variant="filled">
          <Text style={styles.infoTitle}>📊 Análisis Automático</Text>
          <Text style={styles.infoText}>
            Tus reportes se generan automáticamente con información en tiempo real.
            Los datos se actualizan cada vez que realizas una transacción.
          </Text>
        </Card>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  chartCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    gap: theme.spacing.sm,
  },
  bar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  barFill: {
    width: '100%',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
    minHeight: 30,
  },
  barValue: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  barLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[600],
    fontWeight: theme.fontWeight.medium,
  },
  distributionCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  pieContainer: {
    gap: theme.spacing.md,
  },
  pieItem: {
    gap: theme.spacing.xs,
  },
  pieItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieItemLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
  },
  pieItemBar: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  pieItemFill: {
    height: '100%',
  },
  pieItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieItemValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
  },
  pieItemPercentage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    padding: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[700],
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
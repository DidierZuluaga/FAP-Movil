import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
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
import { useAuth } from '../../hooks/useAuth';
import { savingsService } from '../../services/firestore/savingsService';
import { loansService } from '../../services/firestore/loansService';
import { reportsService } from '../../services/reports/reportsService';

const { width } = Dimensions.get('window');

export const ReportsScreen = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [reportData, setReportData] = useState({
    summary: {
      totalSavings: 0,
      totalLoans: 0,
      totalInterests: 0,
      transactions: 0,
    },
    monthlyData: [] as Array<{ month: string; amount: number }>,
    distribution: [] as Array<{ category: string; amount: number; color: string }>,
  });

  // Cargar datos del reporte
  const loadReportData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const [totalSavings, interests, savings, loans] = await Promise.all([
        savingsService.getTotalBalance(user.id),
        savingsService.calculateInterests(user.id),
        savingsService.getUserSavings(user.id),
        loansService.getUserLoans(user.id),
      ]);

      // Calcular préstamos activos
      const activeLoans = loans.filter(l => l.status === 'activo' || l.status === 'aprobado');
      const totalLoansBalance = activeLoans.reduce((sum, loan) => sum + loan.balance, 0);

      // Agrupar ahorros por mes (últimos 5 meses)
      const monthlyMap = new Map<string, number>();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      savings.forEach(saving => {
        const date = new Date(saving.date);
        const key = `${monthNames[date.getMonth()]}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + saving.amount);
      });

      // Obtener últimos 5 meses
      const now = new Date();
      const monthlyData = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthNames[date.getMonth()];
        monthlyData.push({
          month: monthKey,
          amount: monthlyMap.get(monthKey) || 0,
        });
      }

      // Distribución
      const distribution = [
        { 
          category: 'Ahorros', 
          amount: totalSavings, 
          color: theme.colors.success[500] 
        },
        { 
          category: 'Préstamos', 
          amount: totalLoansBalance, 
          color: theme.colors.error[500] 
        },
        { 
          category: 'Intereses', 
          amount: interests, 
          color: theme.colors.primary[500] 
        },
      ];

      setReportData({
        summary: {
          totalSavings,
          totalLoans: totalLoansBalance,
          totalInterests: interests,
          transactions: savings.length + loans.length,
        },
        monthlyData,
        distribution,
      });
    } catch (error) {
      console.error('Error cargando datos del reporte:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [user]);

  // Exportar PDF
  const handleExportPDF = async () => {
    if (!user) return;

    try {
      setIsExporting(true);

      const total = reportData.distribution.reduce((sum, item) => sum + item.amount, 0);
      
      await reportsService.exportToPDF({
        userName: user.name,
        userEmail: user.email,
        totalSavings: reportData.summary.totalSavings,
        totalLoans: reportData.summary.totalLoans,
        totalInterests: reportData.summary.totalInterests,
        transactions: reportData.summary.transactions,
        generatedDate: new Date(),
        monthlyData: reportData.monthlyData,
        distribution: reportData.distribution.map(item => ({
          category: item.category,
          amount: item.amount,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        })),
      });

      if (Platform.OS === 'web') {
        alert('✅ PDF generado exitosamente');
      } else {
        RNAlert.alert('Éxito', 'PDF generado y compartido exitosamente');
      }
    } catch (error) {
      console.error('Error exportando PDF:', error);
      if (Platform.OS === 'web') {
        alert('❌ Error al generar el PDF. Intenta de nuevo.');
      } else {
        RNAlert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Compartir reporte
  const handleShare = async () => {
    if (!user) return;

    try {
      setIsSharing(true);

      const total = reportData.distribution.reduce((sum, item) => sum + item.amount, 0);

      await reportsService.shareAsText({
        userName: user.name,
        userEmail: user.email,
        totalSavings: reportData.summary.totalSavings,
        totalLoans: reportData.summary.totalLoans,
        totalInterests: reportData.summary.totalInterests,
        transactions: reportData.summary.transactions,
        generatedDate: new Date(),
        monthlyData: reportData.monthlyData,
        distribution: reportData.distribution.map(item => ({
          category: item.category,
          amount: item.amount,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        })),
      });
    } catch (error) {
      console.error('Error compartiendo reporte:', error);
      if (Platform.OS === 'web') {
        alert('❌ Error al compartir. Intenta de nuevo.');
      } else {
        RNAlert.alert('Error', 'No se pudo compartir el reporte. Intenta de nuevo.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Calcular máximo con mínimo de 50000 para que las barras tengan buena proporción
const amounts = reportData.monthlyData.map(d => d.amount);
const maxAmount = Math.max(...amounts, 50000); // Mínimo 50,000 para buena visualización

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
        {isLoading ? (
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary[600]} 
            style={styles.loader}
          />
        ) : (
          <>
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
                {reportData.monthlyData.map((item, index) => {
  // CALCULAR ALTURA CORRECTAMENTE con mínimo del 15%
  const rawHeight = (item.amount / maxAmount) * 100;
  const height = Math.max(rawHeight, 15); // Mínimo 15% de altura
  
  return (
    <View key={index} style={styles.bar}>
      <View
        style={[
          styles.barFill,
          {
            height: `${height}%`,
            backgroundColor: theme.colors.primary[500],
            minHeight: 40, // Altura mínima en píxeles
          },
        ]}
      >
        {item.amount > 0 && (
          <Text style={styles.barValue}>
            {(item.amount / 1000).toFixed(0)}k
          </Text>
        )}
      </View>
      <Text style={styles.barLabel}>{item.month}</Text>
      {/* Mostrar valor exacto debajo del mes */}
      <Text style={[styles.barLabel, { marginTop: 4, fontWeight: 'bold' }]}>
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );
})}
              </View>
            </Card>

            {/* Distribution */}
            <Card style={styles.distributionCard}>
              <Text style={styles.chartTitle}>Distribución Financiera</Text>
              
              <View style={styles.pieContainer}>
                {reportData.distribution.map((item, index) => {
                  const total = reportData.distribution.reduce((sum, i) => sum + i.amount, 0);
                  const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                  
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
                loading={isExporting}
                icon={<Download size={20} color={theme.colors.white} />}
              />

              <Button
                title="Compartir"
                onPress={handleShare}
                variant="outline"
                style={styles.actionButton}
                loading={isSharing}
                icon={<Share2 size={20} color={theme.colors.primary[600]} />}
              />
            </View>

            {/* Analysis Info */}
            <Card style={styles.infoCard} variant="filled">
              <Text style={styles.infoTitle}>📊 Análisis Automático</Text>
              <Text style={styles.infoText}>
                {reportData.summary.totalSavings > reportData.summary.totalLoans
                  ? '✅ Excelente. Tus ahorros superan tus préstamos activos. Continúa con este buen ritmo de ahorro.'
                  : '⚠️ Tus préstamos activos superan tus ahorros. Considera incrementar tus aportes mensuales para mejorar tu salud financiera.'}
              </Text>
              <Text style={styles.infoText}>
                {'\n'}Has generado {formatCurrency(reportData.summary.totalInterests)} en intereses,
                lo que representa un {((reportData.summary.totalInterests / Math.max(reportData.summary.totalSavings, 1)) * 100).toFixed(2)}% de tus ahorros totales.
              </Text>
            </Card>
          </>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.gray[50] },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: theme.spacing.lg, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold, color: theme.colors.white, marginBottom: theme.spacing.xs },
  headerSubtitle: { fontSize: theme.fontSize.base, color: theme.colors.white, opacity: 0.9 },
  content: { padding: theme.spacing.lg },
  loader: { marginTop: theme.spacing.xl * 2 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  summaryCard: { width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2, padding: theme.spacing.md, alignItems: 'center' },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  summaryValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginBottom: 4 },
  summaryLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray[600], textAlign: 'center' },
  chartCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  chartTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginBottom: theme.spacing.lg },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, gap: theme.spacing.sm },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.sm },
  barFill: { width: '80%', borderRadius: theme.borderRadius.md, justifyContent: 'flex-start', alignItems: 'center', paddingTop: theme.spacing.xs, minHeight: 40 },
  barValue: { fontSize: theme.fontSize.xs, color: theme.colors.white, fontWeight: theme.fontWeight.semibold },
  barLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray[600], fontWeight: theme.fontWeight.medium },
  distributionCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  pieContainer: { gap: theme.spacing.md },
  pieItem: { gap: theme.spacing.xs },
  pieItemHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  pieItemLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.gray[700] },
  pieItemBar: { height: 8, backgroundColor: theme.colors.gray[200], borderRadius: 4, overflow: 'hidden' },
  pieItemFill: { height: '100%' },
  pieItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pieItemValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.gray[900] },
  pieItemPercentage: { fontSize: theme.fontSize.sm, color: theme.colors.gray[600] },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  actionButton: { flex: 1 },
  infoCard: { padding: theme.spacing.lg },
  infoTitle: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginBottom: theme.spacing.sm },
  infoText: { fontSize: theme.fontSize.sm, color: theme.colors.gray[700], lineHeight: 20 },
  bottomSpacing: { height: 100 },
});
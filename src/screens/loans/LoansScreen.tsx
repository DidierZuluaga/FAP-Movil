import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Alert as RNAlert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard,
  Plus,
  DollarSign,
  CheckCircle,
  X,
  Calculator,
  FileText,
} from 'lucide-react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { theme } from '../../config/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { loansService } from '../../services/firestore/loansService';
import { notificationsService } from '../../services/firestore/notificationsService';
import { useAuth } from '../../hooks/useAuth';
import { calculateMonthlyPayment, generateAmortizationTable } from '../../utils/calculations';
import { DEFAULT_INTEREST_RATE_ASSOCIATE, DEFAULT_INTEREST_RATE_CLIENT } from '../../utils/constants';

export const LoansScreen = () => {
  const { user } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para préstamos
  const [loans, setLoans] = useState<any[]>([]);
  const [loanHistory, setLoanHistory] = useState<any[]>([]);

  // Formulario de solicitud
  const [requestForm, setRequestForm] = useState({
    amount: '',
    term: '12',
    description: '',
  });
  const [requestErrors, setRequestErrors] = useState<any>({});
  const [calculatedPayment, setCalculatedPayment] = useState(0);
  const [amortizationTable, setAmortizationTable] = useState<any[]>([]);

  // Formulario de pago
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<any>({});

  // Cargar préstamos
  const loadLoans = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userLoans = await loansService.getUserLoans(user.id);

      const active = userLoans.filter(
        l => l.status === 'activo' || l.status === 'aprobado'
      );
      const history = userLoans.filter(
        l => l.status === 'pagado' || l.status === 'rechazado'
      );

      setLoans(active);
      setLoanHistory(history);
    } catch (error) {
      console.error('Error cargando préstamos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [user]);

  // Calcular cuota cuando cambian los valores
  useEffect(() => {
    const amount = parseFloat(requestForm.amount);
    const term = parseInt(requestForm.term);

    if (amount > 0 && term > 0) {
      const rate = user?.role === 'asociado' 
        ? DEFAULT_INTEREST_RATE_ASSOCIATE 
        : DEFAULT_INTEREST_RATE_CLIENT;
      
      const payment = calculateMonthlyPayment(amount, rate, term);
      setCalculatedPayment(payment);

      // Generar tabla de amortización
      const table = generateAmortizationTable(amount, rate, term);
      setAmortizationTable(table);
    } else {
      setCalculatedPayment(0);
      setAmortizationTable([]);
    }
  }, [requestForm.amount, requestForm.term, user?.role]);

  // Validar formulario de solicitud
  const validateRequestForm = () => {
    const errors: any = {};
    const amount = parseFloat(requestForm.amount);
    const term = parseInt(requestForm.term);

    if (!requestForm.amount || amount <= 0) {
      errors.amount = 'Ingresa un monto válido';
    }

    if (!requestForm.term || term < 1 || term > 60) {
      errors.term = 'El plazo debe ser entre 1 y 60 meses';
    }

    if (!requestForm.description.trim()) {
      errors.description = 'Ingresa una descripción';
    }

    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Solicitar préstamo
  const handleRequestLoan = async () => {
    if (!validateRequestForm() || !user) return;

    try {
      setIsSaving(true);

      const amount = parseFloat(requestForm.amount);
      const term = parseInt(requestForm.term);
      const rate = user.role === 'asociado' 
        ? DEFAULT_INTEREST_RATE_ASSOCIATE 
        : DEFAULT_INTEREST_RATE_CLIENT;

      await loansService.createLoan(
        user.id,
        amount,
        term,
        requestForm.description,
        rate
      );

      // Crear notificación
      await notificationsService.createNotification(
  user.id, // ← así se accede al ID del usuario
  'general',
  "Solicitud Enviada", 
  "Tu solicitud de préstamo ha sido enviada exitosamente",
  "/loans"
);

      if (Platform.OS === 'web') {
        alert('✅ Solicitud enviada exitosamente. Recibirás una notificación cuando sea aprobada.');
      } else {
        RNAlert.alert(
          'Éxito',
          'Solicitud enviada exitosamente. Recibirás una notificación cuando sea aprobada.'
        );
      }

      // Limpiar y cerrar
      setRequestForm({ amount: '', term: '12', description: '' });
      setShowRequestModal(false);
      await loadLoans();
    } catch (error: any) {
      console.error('Error al solicitar préstamo:', error);
      if (Platform.OS === 'web') {
        alert('❌ Error al enviar la solicitud. Intenta de nuevo.');
      } else {
        RNAlert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Validar formulario de pago
  const validatePaymentForm = () => {
    const errors: any = {};
    const amount = parseFloat(paymentForm.amount);

    if (!paymentForm.amount || amount <= 0) {
      errors.amount = 'Ingresa un monto válido';
    }

    if (selectedLoan && amount > selectedLoan.balance) {
      errors.amount = 'El monto no puede ser mayor al saldo';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Registrar pago
  const handleRegisterPayment = async () => {
    if (!validatePaymentForm() || !user || !selectedLoan) return;

    try {
      setIsSaving(true);

      const amount = parseFloat(paymentForm.amount);

      await loansService.registerPayment(
        selectedLoan.id,
        user.id,
        amount
      );

      // Crear notificación
      await notificationsService.createNotification(
        user.id,
        'general',
        '💰 Abono Registrado',
        `Tu abono de ${formatCurrency(amount)} ha sido registrado exitosamente.`
      );

      if (Platform.OS === 'web') {
        alert('✅ Abono registrado exitosamente');
      } else {
        RNAlert.alert('Éxito', 'Abono registrado exitosamente');
      }

      // Limpiar y cerrar
      setPaymentForm({ amount: '' });
      setShowPaymentModal(false);
      setSelectedLoan(null);
      await loadLoans();
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      if (Platform.OS === 'web') {
        alert('❌ Error al registrar el abono. Intenta de nuevo.');
      } else {
        RNAlert.alert('Error', 'No se pudo registrar el abono. Intenta de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Abrir modal de pago
  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
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
          onPress={() => setShowRequestModal(true)}
          icon={<Plus size={20} color={theme.colors.white} />}
          fullWidth
        />

        {isLoading ? (
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary[600]} 
            style={styles.loader}
          />
        ) : (
          <>
            {/* Active Loans */}
            {loans.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Préstamos Activos</Text>

                {loans.map((loan) => {
                  const progress = ((loan.amount - loan.balance) / loan.amount) * 100;
                  const nextPayment = loansService.getNextPaymentDate(loan);

                  return (
                    <Card key={loan.id} style={styles.loanCard}>
                      <View style={styles.loanHeader}>
                        <View>
                          <Text style={styles.loanLabel}>Monto Aprobado</Text>
                          <Text style={styles.loanAmount}>
                            {formatCurrency(loan.amount)}
                          </Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>
                            {loan.status === 'pendiente' ? 'Pendiente' : 'Activo'}
                          </Text>
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
                          <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                          {Math.round(progress)}% pagado
                        </Text>
                      </View>

                      <View style={styles.loanDetails}>
                        <View style={styles.loanDetail}>
                          <Text style={styles.loanDetailLabel}>Plazo</Text>
                          <Text style={styles.loanDetailValue}>{loan.term} meses</Text>
                        </View>
                        <View style={styles.loanDetail}>
                          <Text style={styles.loanDetailLabel}>Tasa</Text>
                          <Text style={styles.loanDetailValue}>{loan.interestRate}% anual</Text>
                        </View>
                        <View style={styles.loanDetail}>
                          <Text style={styles.loanDetailLabel}>Próximo pago</Text>
                          <Text style={styles.loanDetailValue}>
                            {formatDate(nextPayment, 'dd MMM')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.loanActions}>
                        <Button
                          title="Registrar Abono"
                          onPress={() => openPaymentModal(loan)}
                          variant="primary"
                          size="sm"
                          style={styles.actionButton}
                          icon={<DollarSign size={16} color={theme.colors.white} />}
                        />
                        <Button
                          title="Ver Tabla"
                          onPress={() => {
                            setSelectedLoan(loan);
                            const table = generateAmortizationTable(
                              loan.amount,
                              loan.interestRate,
                              loan.term
                            );
                            setAmortizationTable(table);
                            setShowAmortizationModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          style={styles.actionButton}
                          icon={<FileText size={16} color={theme.colors.primary[600]} />}
                        />
                      </View>
                    </Card>
                  );
                })}
              </>
            )}

            {/* No Active Loans */}
            {loans.length === 0 && (
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
                  <Text style={styles.infoBold}>Asociados:</Text> Tasa de interés del {DEFAULT_INTEREST_RATE_ASSOCIATE}% anual
                </Text>
              </View>
              <View style={styles.infoItem}>
                <CheckCircle size={16} color={theme.colors.success[600]} />
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Clientes:</Text> Tasa de interés del {DEFAULT_INTEREST_RATE_CLIENT}% anual
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
            {loanHistory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Historial de Préstamos</Text>

                {loanHistory.map((loan) => (
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
                          {formatDate(loan.requestDate, 'dd MMM yyyy')}
                        </Text>
                      </View>
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidText}>
                          {loan.status === 'pagado' ? 'Pagado' : 'Rechazado'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.bottomSpacing} />

      {/* Modal: Solicitar Préstamo */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Préstamo</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={24} color={theme.colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Monto del Préstamo"
                placeholder="Ej: 2000000"
                value={requestForm.amount}
                onChangeText={(text) => setRequestForm({ ...requestForm, amount: text })}
                keyboardType="numeric"
                error={requestErrors.amount}
                leftIcon={<DollarSign size={20} color={theme.colors.gray[400]} />}
              />

              <Input
                label="Plazo (meses)"
                placeholder="Ej: 12"
                value={requestForm.term}
                onChangeText={(text) => setRequestForm({ ...requestForm, term: text })}
                keyboardType="numeric"
                error={requestErrors.term}
                hint="Entre 1 y 60 meses"
              />

              <Input
                label="Descripción"
                placeholder="Ej: Préstamo para emergencia médica"
                value={requestForm.description}
                onChangeText={(text) => setRequestForm({ ...requestForm, description: text })}
                error={requestErrors.description}
                multiline
              />

              {calculatedPayment > 0 && (
                <Card style={styles.calculationCard} variant="filled">
                  <View style={styles.calculationHeader}>
                    <Calculator size={20} color={theme.colors.primary[600]} />
                    <Text style={styles.calculationTitle}>Cálculo de Cuota</Text>
                  </View>
                  <Text style={styles.calculationLabel}>Cuota Mensual:</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(calculatedPayment)}
                  </Text>
                  <Text style={styles.calculationNote}>
                    Tasa: {user?.role === 'asociado' ? DEFAULT_INTEREST_RATE_ASSOCIATE : DEFAULT_INTEREST_RATE_CLIENT}% anual
                  </Text>
                </Card>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowRequestModal(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Solicitar"
                  onPress={handleRequestLoan}
                  loading={isSaving}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Registrar Pago */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Abono</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color={theme.colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedLoan && (
                <Card style={styles.loanInfoCard} variant="filled">
                  <Text style={styles.loanInfoLabel}>Saldo Pendiente:</Text>
                  <Text style={styles.loanInfoValue}>
                    {formatCurrency(selectedLoan.balance)}
                  </Text>
                </Card>
              )}

              <Input
                label="Monto del Abono"
                placeholder="Ej: 169500"
                value={paymentForm.amount}
                onChangeText={(text) => setPaymentForm({ ...paymentForm, amount: text })}
                keyboardType="numeric"
                error={paymentErrors.amount}
                leftIcon={<DollarSign size={20} color={theme.colors.gray[400]} />}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowPaymentModal(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Registrar"
                  onPress={handleRegisterPayment}
                  loading={isSaving}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Tabla de Amortización */}
      <Modal
        visible={showAmortizationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAmortizationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tabla de Amortización</Text>
              <TouchableOpacity onPress={() => setShowAmortizationModal(false)}>
                <X size={24} color={theme.colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Mes</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cuota</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Interés</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Capital</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Saldo</Text>
              </View>

              {amortizationTable.map((row) => (
                <View key={row.period} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{row.period}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {formatCurrency(row.payment)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {formatCurrency(row.interest)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {formatCurrency(row.principal)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {formatCurrency(row.balance)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  loanCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  loanLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray[600], marginBottom: 4 },
  loanAmount: { fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900] },
  statusBadge: { backgroundColor: theme.colors.success[100], paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  statusText: { fontSize: theme.fontSize.xs, color: theme.colors.success[700], fontWeight: theme.fontWeight.semibold },
  loanStats: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  loanStat: { flex: 1, backgroundColor: theme.colors.gray[50], padding: theme.spacing.md, borderRadius: theme.borderRadius.lg },
  loanStatLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray[600], marginBottom: 4 },
  loanStatValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900] },
  progressContainer: { marginBottom: theme.spacing.md },
  progressBar: { height: 8, backgroundColor: theme.colors.gray[200], borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: theme.colors.success[500] },
  progressText: { fontSize: theme.fontSize.xs, color: theme.colors.gray[600], textAlign: 'right' },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  loanDetail: { flex: 1 },
  loanDetailLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray[600], marginBottom: 2 },
  loanDetailValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.gray[900] },
  loanActions: { flexDirection: 'row', gap: theme.spacing.md },
  actionButton: { flex: 1 },
  emptyCard: { padding: theme.spacing.xl, alignItems: 'center', marginTop: theme.spacing.lg },
  emptyIcon: { marginBottom: theme.spacing.md },
  emptyTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.base, color: theme.colors.gray[600], textAlign: 'center' },
  infoCard: { padding: theme.spacing.lg, marginTop: theme.spacing.lg },
  infoTitle: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900], marginBottom: theme.spacing.md },
  infoItem: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  infoText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.gray[700], lineHeight: 20 },
  infoBold: { fontWeight: theme.fontWeight.semibold },
  historyCard: { marginBottom: theme.spacing.sm },
  historyContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.success[100], justifyContent: 'center', alignItems: 'center' },
  historyDetails: { flex: 1 },
  historyAmount: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, color: theme.colors.gray[900], marginBottom: 2 },
  historyDate: { fontSize: theme.fontSize.xs, color: theme.colors.gray[500] },
  paidBadge: { backgroundColor: theme.colors.success[100], paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  paidText: { fontSize: theme.fontSize.xs, color: theme.colors.success[700], fontWeight: theme.fontWeight.semibold },
  bottomSpacing: { height: 100 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.gray[200] },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.gray[900] },
  modalBody: { padding: theme.spacing.lg },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  modalButton: { flex: 1 },
  calculationCard: { padding: theme.spacing.md, marginTop: theme.spacing.md },
  calculationHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  calculationTitle: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, color: theme.colors.gray[900] },
  calculationLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray[600], marginTop: theme.spacing.xs },
  calculationValue: { fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold, color: theme.colors.primary[600], marginTop: 4 },
  calculationNote: { fontSize: theme.fontSize.xs, color: theme.colors.gray[500], marginTop: theme.spacing.xs },
  loanInfoCard: { padding: theme.spacing.md, marginBottom: theme.spacing.md },
  loanInfoLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray[600] },
  loanInfoValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.error[600], marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: theme.colors.primary[50], padding: theme.spacing.sm, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xs },
  tableHeaderText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.primary[700], textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.gray[100] },
  tableCell: { fontSize: theme.fontSize.xs, color: theme.colors.gray[700], textAlign: 'center' },
});
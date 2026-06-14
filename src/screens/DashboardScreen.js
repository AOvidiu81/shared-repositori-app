import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, update, get } from 'firebase/database';
import moment from 'moment';
import 'moment/locale/ro';

moment.locale('ro');

const DashboardScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const sessionRef = ref(database, `users/${user.uid}/session`);
      
      onValue(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          const sessionData = snapshot.val();
          setSessionInfo(sessionData);
          setCurrentBalance(sessionData.currentBalance);

          // Listen to transactions
          const transactionsRef = ref(
            database,
            `sessions/${sessionData.sessionId}/transactions`
          );
          
          onValue(transactionsRef, (txSnapshot) => {
            if (txSnapshot.exists()) {
              const txData = txSnapshot.val();
              const txArray = Object.values(txData).sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              );
              setTransactions(txArray);
            } else {
              setTransactions([]);
            }
            setLoading(false);
            setRefreshing(false);
          });
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      });
    } catch (error) {
      console.error('Error loading session:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount) {
      Alert.alert('Eroare', 'Te rog introduceți o sumă');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Eroare', 'Suma trebuie să fie mai mare decât 0');
      return;
    }

    if (withdrawAmount > currentBalance) {
      Alert.alert('Eroare', 'Fonduri insuficiente');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const sessionId = sessionInfo.sessionId;

      // Create transaction
      const transaction = {
        user: user.email,
        amount: withdrawAmount,
        timestamp: new Date().toISOString(),
        type: 'withdrawal',
      };

      // Add to transactions
      const transactionsRef = ref(database, `sessions/${sessionId}/transactions`);
      await push(transactionsRef, transaction);

      // Update session balance
      const newBalance = currentBalance - withdrawAmount;
      const sessionRef = ref(database, `sessions/${sessionId}`);
      await update(sessionRef, {
        currentBalance: newBalance,
      });

      // Update user's session
      const userSessionRef = ref(database, `users/${user.uid}/session`);
      await update(userSessionRef, {
        currentBalance: newBalance,
      });

      setAmount('');
      Alert.alert('Succes', `Ați retras ${withdrawAmount} RON`);
    } catch (error) {
      console.error('Error withdrawing:', error);
      Alert.alert('Eroare', 'Nu s-a putut efectua retragerea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Sigur vrei să te deconectezi?', [
      { text: 'Anulează', onPress: () => {} },
      {
        text: 'Deconectează',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert('Eroare', 'Eroare la deconectare');
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessionData();
  };

  const renderTransaction = ({ item }) => {
    const time = moment(item.timestamp).format('HH:mm:ss');
    const date = moment(item.timestamp).format('DD MMM YYYY');

    return (
      <View style={styles.transactionCard}>
        <View style={styles.txLeft}>
          <Text style={styles.txUser}>👤 {item.user}</Text>
          <Text style={styles.txTime}>{date} la {time}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={styles.txAmount}>-{item.amount} RON</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Bine ai venit! 👋</Text>
              <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutBtn}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Sold disponibil</Text>
            <Text style={styles.balanceAmount}>{currentBalance.toFixed(2)} RON</Text>
            <Text style={styles.balanceSubtext}>
              Inițial: {sessionInfo?.initialAmount.toFixed(2)} RON
            </Text>
          </View>

          {/* Session Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>👥 Participanți</Text>
            <Text style={styles.infoText}>1️⃣ {sessionInfo?.user1}</Text>
            <Text style={styles.infoText}>2️⃣ {sessionInfo?.user2}</Text>
            <Text style={styles.statusBadge}>
              Status: {sessionInfo?.status === 'pending' ? '⏳ În așteptare' : '✅ Activ'}
            </Text>
          </View>

          {/* Withdrawal Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>💸 Retrage fonduri</Text>
            <TextInput
              style={styles.input}
              placeholder="Suma (RON)"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleWithdraw}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Retrage</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Transactions History */}
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📋 Istoric tranzacții</Text>
            {transactions.length > 0 ? (
              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noTransactions}>Nu există tranzacții încă</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#ff5252',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  balanceCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    marginTop: 10,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  txLeft: {
    flex: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  txTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff5252',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default DashboardScreen;

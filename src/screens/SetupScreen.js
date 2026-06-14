import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

const SetupScreen = ({ navigation }) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [secondUserEmail, setSecondUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);
  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    checkForExistingSession();
  }, []);

  const checkForExistingSession = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const sessionsRef = ref(database, `users/${user.uid}/session`);
      const snapshot = await get(sessionsRef);

      if (snapshot.exists()) {
        setSessionExists(true);
        navigation.replace('Dashboard');
      }
      setChecking(false);
    } catch (error) {
      console.error('Error checking session:', error);
      setChecking(false);
    }
  };

  const handleCreateSession = async () => {
    if (!initialAmount || !secondUserEmail) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile');
      return;
    }

    if (auth.currentUser.email === secondUserEmail) {
      Alert.alert('Eroare', 'Trebuie să introduci email-ul unui alt utilizator');
      return;
    }

    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Eroare', 'Suma trebuie să fie mai mare decât 0');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const sessionId = Date.now().toString();

      const sessionData = {
        sessionId,
        user1: user.email,
        user1UID: user.uid,
        user2: secondUserEmail,
        initialAmount: amount,
        currentBalance: amount,
        createdAt: new Date().toISOString(),
        status: 'pending', // pending until user2 accepts
      };

      // Save to user1's profile
      await set(ref(database, `users/${user.uid}/session`), sessionData);

      // Send invitation to user2
      await set(ref(database, `invitations/${secondUserEmail}`), {
        from: user.email,
        sessionId,
        timestamp: new Date().toISOString(),
      });

      Alert.alert(
        'Succes',
        'Invitație trimisă! Așteptăm confirmarea utilizatorului 2.'
      );
      navigation.replace('Dashboard');
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Eroare', 'Nu s-a putut crea sesiunea');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Configurare</Text>
            <Text style={styles.subtitle}>Setează parametrii sesiunii</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Suma inițială (RON)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 1000"
              placeholderTextColor="#999"
              value={initialAmount}
              onChangeText={setInitialAmount}
              keyboardType="decimal-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Email utilizator 2</Text>
            <TextInput
              style={styles.input}
              placeholder="utilizator2@email.com"
              placeholderTextColor="#999"
              value={secondUserEmail}
              onChangeText={setSecondUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Utilizatorul 2 va primi o invitație și va confirma participarea
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreateSession}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Creează sesiune</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>💡 Cum funcționează:</Text>
            <Text style={styles.helpText}>
              1. Introduceți suma inițială disponibilă{'\n'}
              2. Introduceți email-ul utilizatorului 2{'\n'}
              3. El va primi invitația și va confirma{'\n'}
              4. Apoi puteți începe să înregistrați retrageri
            </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#2e7d32',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#bf360c',
    lineHeight: 20,
  },
});

export default SetupScreen;

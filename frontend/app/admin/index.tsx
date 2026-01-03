import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#8B1538',
  secondary: '#D4AF37',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
};

// Simple admin password - change this!
const ADMIN_PASSWORD = 'vastrakala2025';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter admin password');
      return;
    }

    setLoading(true);
    
    if (password === ADMIN_PASSWORD) {
      await AsyncStorage.setItem('admin_logged_in', 'true');
      router.replace('/admin/dashboard');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={50} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>VASTRAKALA</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Admin Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.input}
              placeholder="Enter admin password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Access Admin Panel'}
            </Text>
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.textLight} />
            <Text style={styles.noteText}>
              Default password: vastrakala2025
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    letterSpacing: 3,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 6,
  },
});

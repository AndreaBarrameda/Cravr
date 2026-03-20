import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { signUp } from '../services/firebaseClient';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { setState } = useAppState();

  const validatePassword = (pwd: string) => {
    return pwd.length >= 6;
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to terms and conditions');
      return;
    }

    setLoading(true);
    const { user, error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error);
      return;
    }

    if (user) {
      Alert.alert(
        'Success',
        'Account created!',
        [
          {
            text: 'OK',
            onPress: () => {
              setState((prev) => ({
                ...prev,
                isAuthenticated: true,
                authUser: user,
                userProfile: { name }
              }));
            }
          }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Cravr and discover amazing food</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#C2B6AF"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#C2B6AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C2B6AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            <Text style={styles.hint}>At least 6 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C2B6AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            disabled={loading}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I agree to the Terms & Conditions
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <CravrButton
            label={loading ? 'Creating account...' : 'Sign Up'}
            onPress={handleSignUp}
            disabled={loading}
            loading={loading}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between'
  },
  header: {
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B'
  },
  form: {
    gap: 20,
    marginBottom: 32
  },
  inputGroup: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161616'
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#161616'
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#FF6A2A',
    borderColor: '#FF6A2A'
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  checkboxText: {
    fontSize: 14,
    color: '#161616',
    flex: 1
  },
  footer: {
    gap: 16
  },
  loginLink: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  loginText: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  loginHighlight: {
    color: '#FF6A2A',
    fontWeight: '700'
  }
});

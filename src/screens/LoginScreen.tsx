import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { signIn } from '../services/firebaseClient';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setState } = useAppState();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { user, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
      return;
    }

    if (user) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        authUser: user,
        userProfile: {
          name: user.name || user.email
        }
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Cravr account</Text>
        </View>

        <View style={styles.form}>
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
          </View>

          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              if (!email.trim()) {
                Alert.alert('Error', 'Please enter your email');
                return;
              }
              navigation.navigate('ResetPassword', { email });
            }}
          >
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <CravrButton
            label={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              try {
                // eslint-disable-next-line no-console
                console.log('Sign up button pressed, loading:', loading);
                // eslint-disable-next-line no-console
                console.log('Navigation object:', navigation);
                navigation.navigate('SignUp');
                // eslint-disable-next-line no-console
                console.log('Navigation called');
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Navigation error:', e);
              }
            }}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupHighlight}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
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
    gap: 20
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
  forgotPassword: {
    fontSize: 14,
    color: '#FF6A2A',
    fontWeight: '600',
    textAlign: 'center'
  },
  footer: {
    gap: 16
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0'
  },
  dividerText: {
    fontSize: 13,
    color: '#6B6B6B',
    fontWeight: '500'
  },
  signupLink: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  signupText: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  signupHighlight: {
    color: '#FF6A2A',
    fontWeight: '700'
  }
});

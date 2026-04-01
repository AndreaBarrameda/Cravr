import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { auth } from '../services/supabaseClient';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setLoading(true);
    const { error } = await auth.resetPassword(email);
    setLoading(false);

    if (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String(error.message)
          : 'Failed to send reset email';
      Alert.alert('Error', message);
      return;
    }

    Alert.alert(
      'Success',
      'Password reset email sent! Check your inbox to reset your password.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            We'll send a password reset link to {email}
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Check your email for instructions to reset your password. If you don't see
              an email, check your spam folder.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <CravrButton
            label={loading ? 'Sending...' : 'Send Reset Email'}
            onPress={handleResetPassword}
            disabled={loading}
            loading={loading}
          />

          <CravrButton
            label="Back to Login"
            onPress={() => navigation.goBack()}
            variant="secondary"
            disabled={loading}
          />
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
    paddingBottom: 40,
    justifyContent: 'space-between'
  },
  content: {
    alignItems: 'center'
  },
  emoji: {
    fontSize: 60,
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6A2A'
  },
  infoText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20
  },
  footer: {
    gap: 12
  }
});

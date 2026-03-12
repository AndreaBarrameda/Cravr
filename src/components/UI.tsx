import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

export function CravrButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#FF6A2A'} />
      ) : (
        <Text style={isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function ScreenContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24
  },
  button: {
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: {
    backgroundColor: '#FF6A2A'
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD0B5'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonTextSecondary: {
    color: '#FF6A2A',
    fontSize: 16,
    fontWeight: '600'
  }
});


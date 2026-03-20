import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { tokens } from '../theme/tokens';

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
        <ActivityIndicator color={isPrimary ? tokens.colors.textInverse : tokens.colors.primary} />
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
    flexDirection: 'column',
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: 60,
    paddingBottom: tokens.spacing.xxl
  },
  button: {
    borderRadius: tokens.radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: {
    backgroundColor: tokens.colors.primary,
    ...tokens.glows.primaryGlow
  },
  buttonSecondary: {
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonTextPrimary: {
    color: tokens.colors.textInverse,
    fontSize: 16,
    fontWeight: '600'
  },
  buttonTextSecondary: {
    color: tokens.colors.primary,
    fontSize: 16,
    fontWeight: '600'
  }
});


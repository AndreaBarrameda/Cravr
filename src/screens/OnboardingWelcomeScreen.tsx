import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Centered Logo */}
        <View style={styles.logoCenter}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImageLarge}
            resizeMode="contain"
          />
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('OnboardingProfile')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Let's get started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    justifyContent: 'space-between'
  },
  logoCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoImageLarge: {
    width: 280,
    height: 280
  },
  button: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.glows.primaryGlow
  },
  buttonText: {
    color: tokens.colors.textInverse,
    fontSize: 16,
    fontWeight: '700'
  }
});

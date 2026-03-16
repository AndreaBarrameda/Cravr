import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CRAVR</Text>
      <Text style={styles.tagline}>Your cravings, matched.</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('OnboardingPreferences')}
      >
        <Text style={styles.buttonText}>Let's get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FF6A2A',
    letterSpacing: 2,
    marginBottom: 12
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 40
  },
  button: {
    backgroundColor: '#FF6A2A',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

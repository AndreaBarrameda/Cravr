import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

type LocationPermissionModalProps = {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
};

export function LocationPermissionModal({
  visible,
  onAllow,
  onDeny
}: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDeny}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📍</Text>
            </View>

            <Text style={styles.title}>Enable Location</Text>

            <Text style={styles.description}>
              CRAVR uses your location to find the best restaurants and dishes
              around you. This helps us provide personalized recommendations.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.denyButton]}
                onPress={onDeny}
              >
                <Text style={styles.denyButtonText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.allowButton]}
                onPress={onAllow}
              >
                <Text style={styles.allowButtonText}>Allow</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.note}>
              You can change this in Settings at any time.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '85%',
    borderRadius: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 20
  },
  icon: {
    fontSize: 48
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  denyButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5E5'
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616'
  },
  allowButton: {
    backgroundColor: '#FF6A2A'
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  note: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center'
  }
});

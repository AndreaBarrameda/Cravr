import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';

type Props = NativeStackScreenProps<RootStackParamList, 'TasteAttributes'>;

type Attributes = {
  temperature: 'hot' | 'cold' | 'room' | null;
  flavor: 'savory' | 'sweet' | 'spicy' | 'umami' | 'sour' | null;
  texture: 'brothy' | 'soft' | 'crunchy' | 'creamy' | 'chewy' | null;
  intensity: 'mild' | 'medium' | 'intense' | null;
  occasion: 'solo' | 'date' | 'group' | null;
  budget: 'budget' | 'casual' | 'upscale' | null;
};

export function TasteAttributesScreen({ route, navigation }: Props) {
  const { cravingId, cuisine } = route.params;
  const [attributes, setAttributes] = useState<Attributes>({
    temperature: null,
    flavor: null,
    texture: null,
    intensity: null,
    occasion: null,
    budget: null
  });

  const setAttribute = (key: keyof Attributes, value: any) => {
    setAttributes((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }));
  };

  const isComplete = Object.values(attributes).every((v) => v !== null);

  const handleContinue = () => {
    navigation.navigate('DishDiscovery', {
      cravingId,
      cuisine,
      attributes
    });
  };

  const AttributeButton = ({
    label,
    value,
    attrKey
  }: {
    label: string;
    value: any;
    attrKey: keyof Attributes;
  }) => {
    const isSelected = attributes[attrKey] === value;
    return (
      <TouchableOpacity
        style={[styles.button, isSelected && styles.buttonSelected]}
        onPress={() => setAttribute(attrKey, value)}
      >
        <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you in the mood for?</Text>
          <Text style={styles.subtitle}>Tell us about your perfect dish</Text>
        </View>

        {/* Temperature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌡️ Temperature</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Hot" value="hot" attrKey="temperature" />
            <AttributeButton label="Cold" value="cold" attrKey="temperature" />
            <AttributeButton label="Room Temp" value="room" attrKey="temperature" />
          </View>
        </View>

        {/* Flavor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😋 Flavor Profile</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Savory" value="savory" attrKey="flavor" />
            <AttributeButton label="Sweet" value="sweet" attrKey="flavor" />
            <AttributeButton label="Spicy" value="spicy" attrKey="flavor" />
          </View>
          <View style={styles.buttonRow}>
            <AttributeButton label="Umami" value="umami" attrKey="flavor" />
            <AttributeButton label="Sour" value="sour" attrKey="flavor" />
          </View>
        </View>

        {/* Texture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥘 Texture</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Brothy" value="brothy" attrKey="texture" />
            <AttributeButton label="Soft" value="soft" attrKey="texture" />
            <AttributeButton label="Crunchy" value="crunchy" attrKey="texture" />
          </View>
          <View style={styles.buttonRow}>
            <AttributeButton label="Creamy" value="creamy" attrKey="texture" />
            <AttributeButton label="Chewy" value="chewy" attrKey="texture" />
          </View>
        </View>

        {/* Intensity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Intensity</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Mild" value="mild" attrKey="intensity" />
            <AttributeButton label="Medium" value="medium" attrKey="intensity" />
            <AttributeButton label="Intense" value="intense" attrKey="intensity" />
          </View>
        </View>

        {/* Occasion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Occasion</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Solo" value="solo" attrKey="occasion" />
            <AttributeButton label="Date" value="date" attrKey="occasion" />
            <AttributeButton label="Group" value="group" attrKey="occasion" />
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Budget</Text>
          <View style={styles.buttonRow}>
            <AttributeButton label="Budget" value="budget" attrKey="budget" />
            <AttributeButton label="Casual" value="casual" attrKey="budget" />
            <AttributeButton label="Upscale" value="upscale" attrKey="budget" />
          </View>
        </View>
      </ScrollView>

      <ScreenContainer>
        <CravrButton
          label="Find Matching Dishes"
          onPress={handleContinue}
          disabled={!isComplete}
        />
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0'
  },
  buttonSelected: {
    backgroundColor: '#FF6A2A',
    borderColor: '#FF6A2A'
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333'
  },
  buttonTextSelected: {
    color: '#FFFFFF'
  }
});

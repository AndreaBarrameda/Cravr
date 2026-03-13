import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
};

export function ChatScreen({ route }: Props) {
  const { matchId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMessages(matchId);
        setMessages(data.messages);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };
    load();
  }, [matchId]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      const res = await api.sendMessage(matchId, text);
      setMessages((prev) => [...prev, res.message]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScreenContainer>
        <Text style={styles.title}>Chat</Text>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, styles.bubbleRowSelf]}>
              <View style={[styles.bubble, styles.bubbleSelf]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messages}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  messages: {
    flexGrow: 1,
    paddingVertical: 8
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  bubbleRowSelf: {
    justifyContent: 'flex-end'
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  bubbleSelf: {
    backgroundColor: '#FF6A2A'
  },
  bubbleText: {
    color: '#FFFFFF'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  input: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8
  },
  sendButton: {
    backgroundColor: '#FF6A2A',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});


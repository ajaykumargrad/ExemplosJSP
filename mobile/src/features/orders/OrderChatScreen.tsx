import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type ChatRouteParams = {
  OrderChat: {
    orderId: number;
  };
};

type MessageItem = {
  id: number;
  order_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

export function OrderChatScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const params = route.params as ChatRouteParams['OrderChat'];
  const orderId = params?.orderId;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    supabase
      .from('messages')
      .select('id, order_id, sender_id, body, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as MessageItem[]) ?? []);
      });

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          const incoming = payload.new as MessageItem;
          setMessages((current) => [...current, incoming]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const send = async () => {
    if (!user || !orderId || !draft.trim()) return;

    setSending(true);
    await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: user.id,
      body: draft.trim()
    });
    setDraft('');
    setSending(false);
  };

  const ordered = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={ordered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 14, gap: 8 }}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={mine ? styles.mineText : styles.otherText}>{item.body}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message"
          style={styles.input}
          multiline
        />
        <Pressable style={[styles.sendButton, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
          <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  bubble: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '80%' },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#111827' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
  mineText: { color: '#fff' },
  otherText: { color: '#111827' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 12, gap: 8, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, maxHeight: 100 },
  sendButton: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '700' }
});

import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type ReviewRouteParams = {
  ReviewOrder: {
    orderId: number;
  };
};

export function ReviewOrderScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const params = route.params as ReviewRouteParams['ReviewOrder'];
  const orderId = params?.orderId;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    supabase
      .from('orders')
      .select('provider_id')
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        setProviderId((data as { provider_id: string } | null)?.provider_id ?? null);
      });

    supabase
      .from('reviews')
      .select('rating, comment')
      .eq('order_id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const existing = data as { rating: number; comment: string | null };
        setRating(existing.rating);
        setComment(existing.comment ?? '');
      });
  }, [orderId]);

  const save = async () => {
    if (!orderId || !user || !providerId) return;

    setLoading(true);
    const { error } = await supabase.from('reviews').upsert({
      order_id: orderId,
      reviewer_id: user.id,
      reviewee_id: providerId,
      rating,
      comment: comment.trim() || null
    });
    setLoading(false);

    if (error) {
      Alert.alert('Could not save review', error.message);
      return;
    }

    Alert.alert('Thanks!', 'Your review was saved.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate your order</Text>
      <Text style={styles.subtitle}>How was your experience?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)}>
            <Text style={styles.star}>{value <= rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Optional comment"
        style={styles.input}
        multiline
      />

      <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={save} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save review'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#64748b' },
  stars: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 6 },
  star: { fontSize: 36, color: '#f59e0b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, minHeight: 100, textAlignVertical: 'top' },
  button: { marginTop: 8, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }
});

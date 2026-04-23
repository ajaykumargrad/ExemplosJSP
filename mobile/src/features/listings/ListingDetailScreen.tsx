import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

type ListingRecord = {
  id: number;
  provider_id: string;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
};

type ListingDetailRouteParams = {
  ListingDetail: {
    listingId: number;
  };
};

export function ListingDetailScreen() {
  const route = useRoute();
  const params = route.params as ListingDetailRouteParams['ListingDetail'];
  const listingId = params?.listingId;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listing, setListing] = useState<ListingRecord | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    supabase
      .from('listings')
      .select('id, provider_id, title, description, category, price_cents')
      .eq('id', listingId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Could not load listing', error.message);
          setLoading(false);
          return;
        }

        setListing((data as ListingRecord | null) ?? null);
        setLoading(false);
      });
  }, [listingId]);

  const requestOrder = async () => {
    if (!user || !listing) return;
    if (user.id === listing.provider_id) {
      Alert.alert('Not allowed', 'You cannot request your own listing.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.functions.invoke('order-actions', {
      body: {
        action: 'create_order',
        listing_id: listing.id
      }
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Could not create request', error.message);
      return;
    }

    Alert.alert('Request sent', 'Your order request was created successfully.');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Listing not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.category}>{listing.category}</Text>
      {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}
      <Text style={styles.price}>${(listing.price_cents / 100).toFixed(2)}</Text>

      <Pressable style={styles.button} onPress={requestOrder} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Sending request...' : 'Request booking/order'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700' },
  category: { color: '#475569', textTransform: 'capitalize' },
  description: { marginTop: 6, color: '#334155', lineHeight: 22 },
  price: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  button: { marginTop: 16, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  notFound: { color: '#64748b', fontSize: 16 }
});

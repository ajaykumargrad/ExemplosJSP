import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { distanceInKm } from '../../utils/geo';
import { useAuth } from '../auth/AuthProvider';

type Listing = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
  lat: number | null;
  lng: number | null;
};

type ListingWithDistance = Listing & {
  distanceKm: number | null;
};

const CATEGORIES = ['all', 'delivery', 'beauty', 'services', 'grocery'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

export function HomeFeedScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const fetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setLocationError('Location permission denied. Showing unsorted listings.');
      setCoords(null);
      return;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

    setLocationError(null);
    setCoords({
      lat: current.coords.latitude,
      lng: current.coords.longitude
    });
  };

  const fetchListings = async () => {
    let query = supabase
      .from('listings')
      .select('id, title, description, category, price_cents, lat, lng')
      .eq('is_active', true)
      .limit(100);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    setListings((data ?? []) as Listing[]);
  };

  const refresh = async () => {
    try {
      await Promise.all([fetchLocation(), fetchListings()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [category]);

  const sortedListings = useMemo<ListingWithDistance[]>(() => {
    const mapped = listings.map((listing) => {
      if (!coords || listing.lat == null || listing.lng == null) {
        return { ...listing, distanceKm: null };
      }

      return {
        ...listing,
        distanceKm: distanceInKm(coords.lat, coords.lng, listing.lat, listing.lng)
      };
    });

    return mapped.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return a.id - b.id;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [coords, listings]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Nearby for you</Text>
          <Text style={styles.subtitle}>Step 2: home feed + filters + distance sort</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.headerAction}>My orders</Text>
          </Pressable>
          <Pressable onPress={signOut}>
            <Text style={styles.headerAction}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      {locationError && <Text style={styles.warning}>{locationError}</Text>}

      <FlatList
        data={sortedListings}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          refresh();
        }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No listings found in this category.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.price}>${(item.price_cents / 100).toFixed(2)}</Text>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            <Text style={styles.distance}>
              {item.distanceKm == null ? 'Distance unavailable' : `${item.distanceKm.toFixed(1)} km away`}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748b', marginTop: 4 },
  headerActions: { alignItems: 'flex-end', gap: 6 },
  headerAction: { color: '#111827', fontWeight: '700' },
  filters: { maxHeight: 52, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { textTransform: 'capitalize', color: '#111827', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  warning: { color: '#b45309', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '700', flex: 1, paddingRight: 12 },
  price: { fontWeight: '700', color: '#111827' },
  category: { color: '#475569', marginTop: 4, textTransform: 'capitalize' },
  description: { marginTop: 8, color: '#334155' },
  distance: { marginTop: 8, color: '#0f766e', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 24, color: '#64748b' }
});

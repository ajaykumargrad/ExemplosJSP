import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

type OrderStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

type Booking = {
  id: number;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  listings: { title: string } | null;
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  requested:  { label: 'Requested',   color: '#92400e', bg: '#fef3c7' },
  accepted:   { label: 'Confirmed',   color: '#1e40af', bg: '#dbeafe' },
  in_progress:{ label: 'In Progress', color: '#0f766e', bg: '#f0fdf4' },
  completed:  { label: 'Completed',   color: '#15803d', bg: '#dcfce7' },
  cancelled:  { label: 'Cancelled',   color: '#b91c1c', bg: '#fee2e2' },
};

const STEPS: OrderStatus[] = ['requested', 'accepted', 'in_progress', 'completed'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_cents, created_at, listings(title)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setBookings((data as Booking[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color="#0f766e" size="large" /></View>;
  }

  return (
    <View style={s.root}>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🧹</Text>
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptySub}>Book a cleaning service from the Home tab to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          const activeStep = STEPS.indexOf(item.status);
          return (
            <View style={s.card}>
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.listings?.title ?? 'Cleaning Service'}</Text>
                  <Text style={s.cardDate}>{formatDate(item.created_at)} · Booking #{item.id}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {/* Price */}
              <Text style={s.cardPrice}>₹{Math.round(item.total_cents / 100)}</Text>

              {/* Progress bar for non-cancelled */}
              {item.status !== 'cancelled' && (
                <View style={s.progressWrap}>
                  {STEPS.map((step, i) => (
                    <React.Fragment key={step}>
                      <View style={s.stepWrap}>
                        <View style={[s.stepDot, i <= activeStep && s.stepDotActive]} />
                        <Text style={[s.stepLabel, i <= activeStep && s.stepLabelActive]}>
                          {step === 'in_progress' ? 'In Progress' : step.charAt(0).toUpperCase() + step.slice(1)}
                        </Text>
                      </View>
                      {i < STEPS.length - 1 && (
                        <View style={[s.stepLine, i < activeStep && s.stepLineActive]} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 260 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardPrice: { fontSize: 18, fontWeight: '800', color: '#111827' },

  progressWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stepWrap: { alignItems: 'center', gap: 4 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0' },
  stepDotActive: { backgroundColor: '#0f766e' },
  stepLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '500' },
  stepLabelActive: { color: '#0f766e', fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginBottom: 14 },
  stepLineActive: { backgroundColor: '#0f766e' },
});

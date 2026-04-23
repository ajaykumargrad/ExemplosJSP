import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type OrderStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_STEPS: OrderStatus[] = ['requested', 'accepted', 'in_progress', 'completed'];

type OrderItem = {
  id: number;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  provider_id: string;
  customer_id: string;
  listings: {
    title: string;
  } | null;
};

export function OrderTimelineScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_cents, created_at, provider_id, customer_id, listings(title)')
      .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Could not load orders', error.message);
      return;
    }

    setOrders((data as OrderItem[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const canUpdateTo = (order: OrderItem, next: OrderStatus) => {
    if (!user) return false;
    const isProvider = user.id === order.provider_id;
    const isCustomer = user.id === order.customer_id;

    if (next === 'accepted' || next === 'in_progress') return isProvider;
    if (next === 'completed') return isProvider || isCustomer;
    if (next === 'cancelled') return isCustomer;
    return false;
  };

  const updateStatus = async (order: OrderItem, next: OrderStatus) => {
    if (!canUpdateTo(order, next)) return;

    setUpdatingId(order.id);
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id);
    setUpdatingId(null);

    if (error) {
      Alert.alert('Status update failed', error.message);
      return;
    }

    await fetchOrders();
  };

  const actionButtons = useMemo(
    () => (order: OrderItem) => {
      if (order.status === 'requested') {
        return (
          <View style={styles.actionRow}>
            {canUpdateTo(order, 'accepted') ? (
              <ActionButton
                label="Accept"
                onPress={() => updateStatus(order, 'accepted')}
                disabled={updatingId === order.id}
              />
            ) : null}
            {canUpdateTo(order, 'cancelled') ? (
              <ActionButton
                label="Cancel"
                tone="danger"
                onPress={() => updateStatus(order, 'cancelled')}
                disabled={updatingId === order.id}
              />
            ) : null}
          </View>
        );
      }

      if (order.status === 'accepted' && canUpdateTo(order, 'in_progress')) {
        return (
          <View style={styles.actionRow}>
            <ActionButton
              label="Mark in progress"
              onPress={() => updateStatus(order, 'in_progress')}
              disabled={updatingId === order.id}
            />
          </View>
        );
      }

      if (order.status === 'in_progress' && canUpdateTo(order, 'completed')) {
        return (
          <View style={styles.actionRow}>
            <ActionButton
              label="Mark completed"
              onPress={() => updateStatus(order, 'completed')}
              disabled={updatingId === order.id}
            />
          </View>
        );
      }

      return null;
    },
    [updatingId]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.listings?.title ?? 'Listing'}</Text>
            <Text style={styles.subtle}>Order #{item.id}</Text>
            <Text style={styles.subtle}>${(item.total_cents / 100).toFixed(2)}</Text>
            <Timeline status={item.status} />
            <View style={styles.actionRow}>
              <ActionButton
                label="Open chat"
                onPress={() => navigation.navigate('OrderChat', { orderId: item.id })}
              />
              {item.status === 'completed' && user?.id === item.customer_id ? (
                <ActionButton
                  label="Leave review"
                  onPress={() => navigation.navigate('ReviewOrder', { orderId: item.id })}
                />
              ) : null}
            </View>
            {actionButtons(item)}
          </View>
        )}
      />
    </View>
  );
}

function Timeline({ status }: { status: OrderStatus }) {
  const activeIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  if (status === 'cancelled') {
    return <Text style={styles.cancelled}>Cancelled</Text>;
  }

  return (
    <View style={styles.timelineWrap}>
      {STATUS_STEPS.map((step, idx) => {
        const active = idx <= activeIndex;

        return (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.replace('_', ' ')}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  tone = 'default'
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable style={[styles.actionButton, tone === 'danger' && styles.actionButtonDanger, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  subtle: { color: '#64748b' },
  timelineWrap: { marginTop: 10, gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: '#0f766e' },
  stepLabel: { color: '#94a3b8', textTransform: 'capitalize' },
  stepLabelActive: { color: '#0f766e', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: { backgroundColor: '#111827', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  actionButtonDanger: { backgroundColor: '#b91c1c' },
  actionText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 30, color: '#64748b' },
  cancelled: { color: '#b91c1c', fontWeight: '700', marginTop: 8 }
});

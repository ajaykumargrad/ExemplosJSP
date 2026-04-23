import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const register = async () => {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const token = await Notifications.getExpoPushTokenAsync();

      await supabase.from('user_push_tokens').upsert(
        {
          user_id: user.id,
          expo_push_token: token.data,
          platform: Device.osName ?? 'unknown'
        },
        { onConflict: 'expo_push_token' }
      );
    };

    register();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`orders-notify-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`
        },
        async (payload) => {
          const next = payload.new as { id: number; status: string };

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Order update',
              body: `Order #${next.id} is now ${next.status.replace('_', ' ')}.`
            },
            trigger: null
          });

          await supabase.from('notification_events').insert({
            user_id: user.id,
            order_id: next.id,
            channel: 'push',
            message: `Order #${next.id} is now ${next.status}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return <>{children}</>;
}

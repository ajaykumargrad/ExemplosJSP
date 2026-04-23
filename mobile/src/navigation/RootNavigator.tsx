import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../features/auth/AuthProvider';
import { AuthScreen } from '../features/auth/AuthScreen';
import { HomeFeedScreen } from '../features/listings/HomeFeedScreen';
import { ListingDetailScreen } from '../features/listings/ListingDetailScreen';
import { OrderChatScreen } from '../features/orders/OrderChatScreen';
import { OrderTimelineScreen } from '../features/orders/OrderTimelineScreen';
import { ReviewOrderScreen } from '../features/orders/ReviewOrderScreen';
import { ProfileSetupScreen } from '../features/profile/ProfileSetupScreen';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isLoading, user } = useAuth();
  const [profileReady, setProfileReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfileReady(false);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setProfileReady(false);
          setProfileLoading(false);
          return;
        }

        setProfileReady(Boolean(data?.full_name));
        setProfileLoading(false);
      });
  }, [user]);

  if (isLoading || profileLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : !profileReady ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: 'Profile Setup' }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeFeedScreen} options={{ title: 'Pronto' }} />
            <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Listing details' }} />
            <Stack.Screen name="Orders" component={OrderTimelineScreen} options={{ title: 'My orders' }} />
            <Stack.Screen name="OrderChat" component={OrderChatScreen} options={{ title: 'Order chat' }} />
            <Stack.Screen name="ReviewOrder" component={ReviewOrderScreen} options={{ title: 'Review order' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

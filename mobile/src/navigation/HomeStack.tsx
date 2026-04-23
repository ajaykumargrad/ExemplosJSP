import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeFeedScreen } from '../features/listings/HomeFeedScreen';
import { ListingDetailScreen } from '../features/listings/ListingDetailScreen';

const Stack = createNativeStackNavigator();

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: '', headerBackTitle: 'Back', headerShadowVisible: false, headerStyle: { backgroundColor: '#fff' } }}
      />
    </Stack.Navigator>
  );
}

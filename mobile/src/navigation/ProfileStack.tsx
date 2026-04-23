import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from '../features/profile/ProfileScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { SavedAddressesScreen } from '../features/profile/SavedAddressesScreen';
import { ReferScreen } from '../features/refer/ReferScreen';

const Stack = createNativeStackNavigator();

const headerOpts = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: '#fff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#111827' },
  headerBackTitle: 'Back',
};

export function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ ...headerOpts, title: 'Edit Profile' }} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} options={{ ...headerOpts, title: 'Saved Addresses' }} />
      <Stack.Screen name="Refer" component={ReferScreen} options={{ ...headerOpts, title: 'Refer & Earn' }} />
    </Stack.Navigator>
  );
}

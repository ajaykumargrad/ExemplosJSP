import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../features/auth/AuthProvider';
import { AuthScreen } from '../features/auth/AuthScreen';
import { ProfileSetupScreen } from '../features/profile/ProfileSetupScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isLoading, user, profileReady } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0f766e" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !profileReady ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: true, title: 'Set up profile' }} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

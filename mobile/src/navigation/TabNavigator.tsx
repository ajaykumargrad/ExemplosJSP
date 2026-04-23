import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './HomeStack';
import { BookingsScreen } from '../features/bookings/BookingsScreen';
import { ProfileStack } from './ProfileStack';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{
          title: 'Bookings',
          headerShown: true,
          headerTitle: 'My Bookings',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

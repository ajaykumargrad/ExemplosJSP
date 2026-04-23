import React from 'react';
import type { PropsWithChildren } from 'react';

// expo-notifications is not supported in Expo Go SDK 54.
// Push notification registration is disabled until a development build is used.
export function NotificationProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

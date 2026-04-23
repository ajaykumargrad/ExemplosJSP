import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthProvider';

function getReferralCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

const HOW_IT_WORKS = [
  { step: 1, text: 'Share your unique referral code with a friend' },
  { step: 2, text: 'Friend signs up and books their first service' },
  { step: 3, text: 'You get ₹100 added to your wallet instantly' },
];

export function ReferScreen() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = user ? getReferralCode(user.id) : 'PRONTO';

  const copyCode = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `🧹 Use my code ${code} on Pronto to get ₹50 off your first cleaning! Download: https://prunto.app`,
        title: 'Join Pronto — Get ₹50 off!',
      });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={s.heroCard}>
          <Text style={s.heroEmoji}>🙌</Text>
          <Text style={s.heroTagline}>Refer a friend to Pronto</Text>
          <Text style={s.heroAmount}>Get ₹100</Text>
          <Text style={s.heroSub}>Your friend gets flat ₹50 off{'\n'}on their first order on Pronto.</Text>

          {/* Referral code */}
          <Pressable style={s.codeRow} onPress={copyCode}>
            <Text style={s.codeText}>{code}</Text>
            <Text style={s.copyIcon}>{copied ? '✓' : '⧉'}</Text>
          </Pressable>
          {copied && <Text style={s.copiedHint}>Copied to clipboard!</Text>}
        </View>

        {/* How it works */}
        <View style={s.howSection}>
          <Text style={s.howTitle}>How it works</Text>
          {HOW_IT_WORKS.map(item => (
            <View key={item.step} style={s.howRow}>
              <View style={s.howBadge}>
                <Text style={s.howBadgeText}>{item.step}</Text>
              </View>
              <Text style={s.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Terms */}
        <Text style={s.terms}>
          *Reward credited within 24 hours of friend's first completed booking. Valid for new users only.
        </Text>

      </ScrollView>

      {/* Sticky bottom buttons */}
      <View style={s.bottomBar}>
        <Pressable style={s.shareBtn} onPress={shareInvite}>
          <Text style={s.shareBtnText}>Share invite link</Text>
        </Pressable>
        <Pressable onPress={shareInvite}>
          <Text style={s.findFriends}>Find friends to refer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16, paddingBottom: 140, gap: 16 },

  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  heroEmoji: { fontSize: 80, marginBottom: 8 },
  heroTagline: { fontSize: 16, color: '#374151', fontWeight: '500' },
  heroAmount: { fontSize: 44, fontWeight: '800', color: '#0f766e' },
  heroSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  codeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f1f5f9', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 14, marginTop: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  codeText: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: 3 },
  copyIcon: { fontSize: 20, color: '#64748b' },
  copiedHint: { fontSize: 12, color: '#0f766e', fontWeight: '600' },

  howSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  howTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  howBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  howBadgeText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  howText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20, paddingTop: 6 },

  terms: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    padding: 16, paddingBottom: 32, gap: 12,
  },
  shareBtn: {
    backgroundColor: '#111827', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  findFriends: { color: '#0f766e', fontWeight: '700', fontSize: 15, textAlign: 'center' },
});

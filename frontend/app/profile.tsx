import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

const COLORS = {
  primary: '#8B1538',
  secondary: '#D4AF37',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#F44336',
};

const menuItems = [
  { id: 'orders', icon: 'receipt-outline', title: 'My Orders', subtitle: 'Track your orders', route: '/orders' },
  { id: 'wishlist', icon: 'heart-outline', title: 'Wishlist', subtitle: 'Your favorite items', route: '/wishlist' },
  { id: 'address', icon: 'location-outline', title: 'Addresses', subtitle: 'Manage delivery addresses', route: null },
  { id: 'payments', icon: 'card-outline', title: 'Payment Methods', subtitle: 'Saved cards & UPI', route: null },
  { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Offers & updates', route: null },
];

const supportItems = [
  { id: 'help', icon: 'help-circle-outline', title: 'Help Center' },
  { id: 'contact', icon: 'call-outline', title: 'Contact Us' },
  { id: 'about', icon: 'information-circle-outline', title: 'About Vastrakala' },
  { id: 'terms', icon: 'document-text-outline', title: 'Terms & Conditions' },
  { id: 'privacy', icon: 'shield-outline', title: 'Privacy Policy' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      // For demo purposes, simulate Google sign-in
      // In production, use expo-auth-session with actual Google OAuth
      const mockGoogleData = {
        email: `user${Date.now()}@gmail.com`,
        name: 'Demo User',
        picture: '',
        google_id: `google_${Date.now()}`,
      };
      
      await signInWithGoogle(mockGoogleData);
      Alert.alert('Success', 'Signed in successfully!');
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.route) {
      router.push(item.route as any);
    } else {
      Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Ionicons name="person" size={40} color={COLORS.white} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.white} />
            )}
          </View>
          {user ? (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.brandName}>VASTRAKALA</Text>
              <Text style={styles.tagline}>Your destination for ethnic elegance</Text>
            </>
          )}
        </View>

        {/* Auth Section */}
        {!user ? (
          <View style={styles.authSection}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={COLORS.white} />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.authNote}>Sign in for exclusive offers & easy checkout</Text>
          </View>
        ) : (
          <View style={styles.signedInBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.signedInText}>Signed in</Text>
          </View>
        )}

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                styles.supportMenuItem,
                index === supportItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
            >
              <Ionicons name={item.icon as any} size={20} color={COLORS.textLight} />
              <Text style={styles.supportMenuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        {user && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textLight} />
            <Text style={styles.contactText}>support@vastrakala.in</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.textLight} />
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </View>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-whatsapp" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Vastrakala v1.0.0</Text>
          <Text style={styles.copyrightText}>Made with love in India</Text>
        </View>

        {/* Admin Access */}
        <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin')}>
          <Ionicons name="settings-outline" size={18} color={COLORS.textLight} />
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 3,
    marginTop: 4,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 8,
  },
  authSection: {
    padding: 20,
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  authNote: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 12,
  },
  signedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.success + '15',
  },
  signedInText: {
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  supportMenuItem: {
    paddingVertical: 12,
  },
  supportMenuTitle: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signOutText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  contactSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  adminButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
});

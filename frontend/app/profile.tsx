import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#8B1538',
  secondary: '#D4AF37',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
};

const menuItems = [
  { id: 'orders', icon: 'receipt-outline', title: 'My Orders', subtitle: 'Track your orders' },
  { id: 'wishlist', icon: 'heart-outline', title: 'Wishlist', subtitle: 'Your favorite items' },
  { id: 'address', icon: 'location-outline', title: 'Addresses', subtitle: 'Manage delivery addresses' },
  { id: 'payments', icon: 'card-outline', title: 'Payment Methods', subtitle: 'Saved cards & UPI' },
  { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Offers & updates' },
];

const supportItems = [
  { id: 'help', icon: 'help-circle-outline', title: 'Help Center' },
  { id: 'contact', icon: 'call-outline', title: 'Contact Us' },
  { id: 'about', icon: 'information-circle-outline', title: 'About Vastrakala' },
  { id: 'terms', icon: 'document-text-outline', title: 'Terms & Conditions' },
  { id: 'privacy', icon: 'shield-outline', title: 'Privacy Policy' },
];

export default function ProfileScreen() {
  const handleMenuPress = (id: string) => {
    // For MVP, show coming soon message
    console.log(`Pressed: ${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandName}>VASTRAKALA</Text>
          <Text style={styles.tagline}>Your destination for ethnic elegance</Text>
        </View>

        {/* Guest Message */}
        <View style={styles.guestCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <View style={styles.guestInfo}>
            <Text style={styles.guestTitle}>You're browsing as guest</Text>
            <Text style={styles.guestSubtitle}>Sign up for exclusive offers & easy checkout</Text>
          </View>
        </View>

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
              onPress={() => handleMenuPress(item.id)}
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
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon as any} size={20} color={COLORS.textLight} />
              <Text style={styles.supportMenuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
            </TouchableOpacity>
          ))}
        </View>

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
          <Text style={styles.copyrightText}>Made with ❤️ in India</Text>
        </View>

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
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestInfo: {
    marginLeft: 12,
    flex: 1,
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  guestSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
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
});

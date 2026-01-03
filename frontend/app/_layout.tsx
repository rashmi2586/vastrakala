import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';

const COLORS = {
  primary: '#8B1538',
  secondary: '#D4AF37',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textLight,
              tabBarLabelStyle: styles.tabBarLabel,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="categories"
              options={{
                title: 'Categories',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="grid" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="wishlist"
              options={{
                title: 'Wishlist',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="heart" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="cart"
              options={{
                title: 'Cart',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="cart" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="person" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="product/[id]"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="category/[name]"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="checkout"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="orders"
              options={{
                href: null,
              }}
            />
          </Tabs>
        </SafeAreaProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

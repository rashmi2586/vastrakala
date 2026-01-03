import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cart`);
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, []);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      await axios.put(`${API_URL}/api/cart/${itemId}`, { quantity: newQuantity });
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/cart/${itemId}`);
              setCartItems((prev) => prev.filter((item) => item.id !== itemId));
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your entire cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/cart`);
              setCartItems([]);
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Start shopping to add items</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/categories')}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.itemsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <TouchableOpacity
                  style={styles.itemImageContainer}
                  onPress={() => router.push(`/product/${item.product_id}`)}
                >
                  <View style={[styles.itemImagePlaceholder, { backgroundColor: item.color || COLORS.primary }]}>
                    <Ionicons name="shirt-outline" size={30} color={COLORS.white} />
                  </View>
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <TouchableOpacity onPress={() => router.push(`/product/${item.product_id}`)}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product_name}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>Size: {item.size}</Text>
                    <View style={styles.colorContainer}>
                      <Text style={styles.itemDetail}>Color: </Text>
                      <View style={[styles.colorCircle, { backgroundColor: item.color }]} />
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 200 }} />
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, shipping === 0 && styles.freeText]}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </Text>
            </View>
            {subtotal < 2000 && subtotal > 0 && (
              <Text style={styles.freeShippingNote}>
                Add ₹{(2000 - subtotal).toLocaleString('en-IN')} more for free shipping
              </Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => Alert.alert('Coming Soon', 'Checkout functionality will be available soon!')}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  shopButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginRight: 12,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 16,
  },
  removeButton: {
    padding: 8,
  },
  summary: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  freeText: {
    color: COLORS.success,
  },
  freeShippingNote: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});

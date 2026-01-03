import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../src/context/AuthContext';

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
  warning: '#FF9800',
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Order {
  id: string;
  items: {
    product_id: string;
    product_name: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }[];
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.success,
  shipped: COLORS.primary,
  delivered: COLORS.success,
  completed: COLORS.success,
  failed: COLORS.error,
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/orders?user_id=${user.id}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [user]);

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <Text style={styles.emptySubtitle}>Track your orders and view history</Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/categories')}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[order.order_status] + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors[order.order_status] }]} />
                  <Text style={[styles.statusText, { color: statusColors[order.order_status] }]}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items.slice(0, 2).map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={[styles.itemColor, { backgroundColor: item.color || COLORS.primary }]} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                      <Text style={styles.itemMeta}>Size: {item.size} | Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                  </View>
                ))}
                {order.items.length > 2 && (
                  <Text style={styles.moreItems}>+{order.items.length - 2} more items</Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  signInButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  signInButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
  orderCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemColor: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  moreItems: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

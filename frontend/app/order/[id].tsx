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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  warning: '#FF9800',
  info: '#2196F3',
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface TrackingEvent {
  status: string;
  message: string;
  timestamp: string;
  location?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  order_status: string;
  shipping_address?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  created_at: string;
}

const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
  pending: { icon: 'time-outline', color: COLORS.warning, label: 'Order Placed' },
  confirmed: { icon: 'checkmark-circle-outline', color: COLORS.info, label: 'Confirmed' },
  packed: { icon: 'cube-outline', color: COLORS.info, label: 'Packed' },
  shipped: { icon: 'airplane-outline', color: COLORS.primary, label: 'Shipped' },
  in_transit: { icon: 'swap-horizontal-outline', color: COLORS.primary, label: 'In Transit' },
  out_for_delivery: { icon: 'bicycle-outline', color: COLORS.secondary, label: 'Out for Delivery' },
  delivered: { icon: 'checkmark-done-circle-outline', color: COLORS.success, label: 'Delivered' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders/${id}`),
        axios.get(`${API_URL}/api/orders/${id}/tracking`),
      ]);
      setOrder(orderRes.data);
      setTracking(trackingRes.data.tracking || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [id]);

  const simulateDelivery = async () => {
    setSimulating(true);
    try {
      await axios.post(`${API_URL}/api/orders/${id}/simulate-delivery`);
      Alert.alert('Success', 'Delivery simulation complete!');
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error simulating delivery:', error);
      Alert.alert('Error', 'Failed to simulate delivery');
    } finally {
      setSimulating(false);
    }
  };

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStatus = order.order_status;
  const currentStatusConfig = statusConfig[currentStatus] || statusConfig.pending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Order ID & Status */}
        <View style={styles.statusCard}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
          </View>
          <View style={[styles.statusBanner, { backgroundColor: currentStatusConfig.color + '15' }]}>
            <Ionicons name={currentStatusConfig.icon as any} size={32} color={currentStatusConfig.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: currentStatusConfig.color }]}>
                {currentStatusConfig.label}
              </Text>
              <Text style={styles.statusMessage}>
                {tracking.length > 0 ? tracking[tracking.length - 1].message : 'Processing your order'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tracking Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Timeline</Text>
          {tracking.length === 0 ? (
            <View style={styles.noTracking}>
              <Ionicons name="time-outline" size={40} color={COLORS.border} />
              <Text style={styles.noTrackingText}>Tracking updates will appear here</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {[...tracking].reverse().map((event, index) => {
                const config = statusConfig[event.status] || statusConfig.pending;
                const isFirst = index === 0;
                const isLast = index === tracking.length - 1;
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLine}>
                      <View style={[styles.timelineDot, { backgroundColor: config.color }]}>
                        <Ionicons name={config.icon as any} size={14} color={COLORS.white} />
                      </View>
                      {!isLast && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={[styles.timelineContent, isFirst && styles.timelineContentFirst]}>
                      <Text style={[styles.timelineStatus, { color: config.color }]}>
                        {config.label}
                      </Text>
                      <Text style={styles.timelineMessage}>{event.message}</Text>
                      {event.location && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
                          <Text style={styles.locationText}>{event.location}</Text>
                        </View>
                      )}
                      <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          {/* Simulate Delivery Button (for testing) */}
          {order.order_status !== 'delivered' && (
            <TouchableOpacity
              style={styles.simulateButton}
              onPress={simulateDelivery}
              disabled={simulating}
            >
              {simulating ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={18} color={COLORS.white} />
                  <Text style={styles.simulateButtonText}>Simulate Delivery (Demo)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={[styles.itemColor, { backgroundColor: item.color || COLORS.primary }]} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>Size: {item.size} | Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        {order.shipping_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <View style={styles.addressCard}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{order.shipping_address.name}</Text>
                <Text style={styles.addressPhone}>{order.shipping_address.phone}</Text>
                <Text style={styles.addressLine}>
                  {order.shipping_address.addressLine1}
                  {order.shipping_address.addressLine2 && `, ${order.shipping_address.addressLine2}`}
                </Text>
                <Text style={styles.addressLine}>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, order.shipping === 0 && styles.freeText]}>
              {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
          <View style={styles.paymentStatus}>
            <Ionicons
              name={order.payment_status === 'completed' ? 'checkmark-circle' : 'time'}
              size={18}
              color={order.payment_status === 'completed' ? COLORS.success : COLORS.warning}
            />
            <Text style={[
              styles.paymentStatusText,
              { color: order.payment_status === 'completed' ? COLORS.success : COLORS.warning }
            ]}>
              Payment {order.payment_status === 'completed' ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '600',
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
  statusCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  noTracking: {
    alignItems: 'center',
    padding: 24,
  },
  noTrackingText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLine: {
    alignItems: 'center',
    width: 30,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 20,
  },
  timelineContentFirst: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineMessage: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  timelineDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  simulateButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemColor: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  addressPhone: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  addressLine: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  helpTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 25,
  },
  helpButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

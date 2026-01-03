import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', icon: 'time-outline', color: COLORS.warning },
  { id: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline', color: COLORS.info },
  { id: 'packed', label: 'Packed', icon: 'cube-outline', color: COLORS.info },
  { id: 'shipped', label: 'Shipped', icon: 'airplane-outline', color: COLORS.primary },
  { id: 'in_transit', label: 'In Transit', icon: 'swap-horizontal-outline', color: COLORS.primary },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle-outline', color: COLORS.secondary },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle-outline', color: COLORS.success },
];

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders/${id}`),
        axios.get(`${API_URL}/api/orders/${id}/tracking`),
      ]);
      setOrder(orderRes.data);
      setTracking(trackingRes.data.tracking || []);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    const statusInfo = ORDER_STATUSES.find(s => s.id === status);
    
    Alert.alert(
      'Update Status',
      `Change order status to "${statusInfo?.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              await axios.post(`${API_URL}/api/orders/${id}/tracking`, {
                status,
                message: null,
                location: null,
              });
              await fetchOrderDetails();
              Alert.alert('Success', 'Order status updated');
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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

  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.id === order.order_status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.slice(-8).toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.currentStatus}>
            <Ionicons
              name={ORDER_STATUSES.find(s => s.id === order.order_status)?.icon as any || 'time-outline'}
              size={40}
              color={ORDER_STATUSES.find(s => s.id === order.order_status)?.color || COLORS.textLight}
            />
            <Text style={[styles.currentStatusText, { color: ORDER_STATUSES.find(s => s.id === order.order_status)?.color }]}>
              {ORDER_STATUSES.find(s => s.id === order.order_status)?.label || order.order_status}
            </Text>
          </View>
        </View>

        {/* Update Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {ORDER_STATUSES.map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = status.id === order.order_status;
              return (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.statusButton,
                    isActive && { backgroundColor: status.color + '20' },
                    isCurrent && styles.statusButtonCurrent,
                  ]}
                  onPress={() => updateStatus(status.id)}
                  disabled={updating}
                >
                  <Ionicons
                    name={status.icon as any}
                    size={20}
                    color={isActive ? status.color : COLORS.textLight}
                  />
                  <Text style={[
                    styles.statusButtonText,
                    isActive && { color: status.color },
                  ]}>
                    {status.label}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: status.color }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          {order.shipping_address ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoText}>{order.shipping_address.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoText}>{order.shipping_address.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoText}>
                  {order.shipping_address.addressLine1}
                  {order.shipping_address.addressLine2 && `, ${order.shipping_address.addressLine2}`}
                  {`\n${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No shipping address provided</Text>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={[styles.itemColor, { backgroundColor: item.color || COLORS.primary }]} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>Size: {item.size} | Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, order.shipping === 0 && { color: COLORS.success }]}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Tracking History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking History</Text>
          {tracking.length === 0 ? (
            <Text style={styles.noDataText}>No tracking updates yet</Text>
          ) : (
            <View style={styles.timeline}>
              {[...tracking].reverse().map((event, index) => {
                const statusConfig = ORDER_STATUSES.find(s => s.id === event.status);
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: statusConfig?.color || COLORS.textLight }]} />
                    {index < tracking.length - 1 && <View style={styles.timelineConnector} />}
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStatus, { color: statusConfig?.color }]}>
                        {statusConfig?.label || event.status}
                      </Text>
                      <Text style={styles.timelineMessage}>{event.message}</Text>
                      <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  currentStatus: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  currentStatusText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statusButton: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  statusButtonCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusButtonText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.primary,
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineConnector: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

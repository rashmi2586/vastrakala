import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useCart } from '../src/context/CartContext';
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
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const validateAddress = () => {
    if (!address.name || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return false;
    }
    if (!/^[0-9]{10}$/.test(address.phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^[0-9]{6}$/.test(address.pincode)) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateAddress()) return;
    if (!user) {
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      }));

      const orderResponse = await axios.post(`${API_URL}/api/orders`, {
        user_id: user.id,
        items: orderItems,
        subtotal,
        shipping,
        total,
        shipping_address: address,
      });

      const orderId = orderResponse.data.id;

      // Create payment (MOCK)
      const paymentResponse = await axios.post(
        `${API_URL}/api/payment/create?order_id=${orderId}&amount=${total}`
      );

      // Simulate payment success (MOCK)
      Alert.alert(
        'Payment (MOCK)',
        `This is a MOCK payment flow.\n\nOrder Total: ${formatPrice(total)}\n\nIn production, Razorpay payment gateway will open here.`,
        [
          {
            text: 'Simulate Payment Success',
            onPress: async () => {
              try {
                // Verify payment (MOCK)
                await axios.post(`${API_URL}/api/payment/verify`, {
                  order_id: orderId,
                  payment_id: `pay_mock_${Date.now()}`,
                  signature: 'mock_signature',
                });

                Alert.alert(
                  'Order Placed!',
                  'Your order has been placed successfully. You can track it in My Orders.',
                  [
                    {
                      text: 'View Orders',
                      onPress: () => router.replace('/orders'),
                    },
                  ]
                );
              } catch (error) {
                console.error('Payment verification error:', error);
                Alert.alert('Error', 'Payment verification failed');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Shipping Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={address.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={address.addressLine1}
                onChangeText={(text) => setAddress({ ...address, addressLine1: text })}
                placeholder="House/Flat No., Building Name"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={address.addressLine2}
                onChangeText={(text) => setAddress({ ...address, addressLine2: text })}
                placeholder="Street, Locality (Optional)"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={address.city}
                  onChangeText={(text) => setAddress({ ...address, city: text })}
                  placeholder="City"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  value={address.state}
                  onChangeText={(text) => setAddress({ ...address, state: text })}
                  placeholder="State"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={[styles.input, { width: 150 }]}
                value={address.pincode}
                onChangeText={(text) => setAddress({ ...address, pincode: text })}
                placeholder="6-digit pincode"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            {items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.orderItemMeta}>Size: {item.size} | Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

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
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          {/* Payment Note */}
          <View style={styles.paymentNote}>
            <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.paymentNoteText}>
              Payment is in MOCK mode. No real transaction will occur.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={22} color={COLORS.white} />
                <Text style={styles.payButtonText}>Pay {formatPrice(total)}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  section: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderItemMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
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
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: COLORS.secondary + '20',
    borderRadius: 10,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

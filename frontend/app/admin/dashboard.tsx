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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isLoggedIn = await AsyncStorage.getItem('admin_logged_in');
    if (isLoggedIn !== 'true') {
      router.replace('/admin');
      return;
    }
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`),
        axios.get(`${API_URL}/api/admin/orders`),
      ]);

      const products = productsRes.data;
      const orders = ordersRes.data;

      const pendingOrders = orders.filter((o: any) => 
        o.order_status === 'pending' || o.order_status === 'confirmed'
      );
      const totalRevenue = orders
        .filter((o: any) => o.payment_status === 'completed')
        .reduce((sum: number, o: any) => sum + o.total, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('admin_logged_in');
          router.replace('/admin');
        },
      },
    ]);
  };

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const menuItems = [
    { id: 'products', icon: 'shirt-outline', title: 'Products', subtitle: 'Add, edit products', route: '/admin/products', color: COLORS.primary },
    { id: 'orders', icon: 'receipt-outline', title: 'Orders', subtitle: 'Manage orders', route: '/admin/orders', color: COLORS.info },
    { id: 'add', icon: 'add-circle-outline', title: 'Add Product', subtitle: 'Create new listing', route: '/admin/add-product', color: COLORS.success },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>VASTRAKALA</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="shirt" size={28} color={COLORS.white} />
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.info }]}>
            <Ionicons name="receipt" size={28} color={COLORS.white} />
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
            <Ionicons name="time" size={28} color={COLORS.white} />
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
            <Ionicons name="cash" size={28} color={COLORS.white} />
            <Text style={styles.statValue}>{formatPrice(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/admin/orders')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderItem}
                onPress={() => router.push(`/admin/order/${order.id}`)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: 
                    order.order_status === 'delivered' ? COLORS.success + '20' :
                    order.order_status === 'pending' ? COLORS.warning + '20' : COLORS.info + '20'
                  }]}>
                    <Text style={[styles.statusText, { color:
                      order.order_status === 'delivered' ? COLORS.success :
                      order.order_status === 'pending' ? COLORS.warning : COLORS.info
                    }]}>
                      {order.order_status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Back to Store */}
        <TouchableOpacity style={styles.backToStore} onPress={() => router.push('/')}>
          <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
          <Text style={styles.backToStoreText}>Back to Store</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  backToStore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backToStoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
});

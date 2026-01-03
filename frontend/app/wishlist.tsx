import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

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

interface WishlistItem {
  wishlist_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    fabric?: string;
    variants: { color: string; color_code: string }[];
  };
  added_at: string;
}

export default function WishlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/wishlist?user_id=${user.id}`);
      setWishlistItems(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [user]);

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    
    try {
      await axios.delete(`${API_URL}/api/wishlist/${productId}?user_id=${user.id}`);
      setWishlistItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', 'Failed to remove item from wishlist');
    }
  };

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.product.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <View style={[styles.productImagePlaceholder, { backgroundColor: item.product.variants[0]?.color_code || COLORS.primary }]}>
          <Ionicons name="shirt-outline" size={36} color={COLORS.white} />
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            Alert.alert(
              'Remove from Wishlist',
              'Are you sure you want to remove this item?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(item.product.id) },
              ]
            );
          }}
        >
          <Ionicons name="heart" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.productFabric} numberOfLines={1}>{item.product.fabric}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
          {item.product.original_price && item.product.original_price > item.product.price && (
            <Text style={styles.originalPrice}>{formatPrice(item.product.original_price)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Sign in to view wishlist</Text>
          <Text style={styles.emptySubtitle}>Save your favorite items for later</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerSubtitle}>{wishlistItems.length} items</Text>
      </View>

      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Start adding items you love</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/categories')}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={wishlistItems}
          renderItem={renderItem}
          numColumns={2}
          estimatedItemSize={280}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
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
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
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
  listContent: {
    padding: 16,
  },
  productCard: {
    width: cardWidth,
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    height: 160,
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    height: 36,
  },
  productFabric: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
});

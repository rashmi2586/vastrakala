import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';

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

const categoryNames: Record<string, string> = {
  sarees: 'Sarees',
  dress_materials: 'Dress Materials',
  readymade_dresses: 'Readymade Dresses',
  all: 'All Products',
};

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  fabric?: string;
  is_new_arrival: boolean;
  variants: { color: string; color_code: string }[];
}

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const url = name === 'all'
        ? `${API_URL}/api/products`
        : `${API_URL}/api/products?category=${name}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [name]);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <View style={[styles.productImagePlaceholder, { backgroundColor: item.variants[0]?.color_code || COLORS.primary }]}>
          <Ionicons name="shirt-outline" size={36} color={COLORS.white} />
        </View>
        {item.is_new_arrival && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        {item.original_price && item.original_price > item.price && (
          <View style={styles.saleBadge}>
            <Text style={styles.badgeText}>
              {Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
            </Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productFabric} numberOfLines={1}>
          {item.fabric || item.category.replace('_', ' ')}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {item.original_price && item.original_price > item.price && (
            <Text style={styles.originalPrice}>{formatPrice(item.original_price)}</Text>
          )}
        </View>
        <View style={styles.colorDots}>
          {item.variants.slice(0, 4).map((variant, idx) => (
            <View
              key={idx}
              style={[styles.colorDot, { backgroundColor: variant.color_code }]}
            />
          ))}
          {item.variants.length > 4 && (
            <Text style={styles.moreColors}>+{item.variants.length - 4}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const categoryTitle = categoryNames[name as string] || (name as string);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{categoryTitle}</Text>
          <Text style={styles.productCount}>{products.length} Products</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Check back soon for new arrivals</Text>
        </View>
      ) : (
        <FlashList
          data={products}
          renderItem={renderProduct}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  productCount: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
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
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
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
    marginBottom: 8,
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
  colorDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreColors: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

const { width } = Dimensions.get('window');

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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  main_image: string;
  fabric?: string;
  occasion?: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  variants: { color: string; color_code: string }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      const allProducts = response.data;
      setProducts(allProducts);
      setFeaturedProducts(allProducts.filter((p: Product) => p.is_featured));
      setNewArrivals(allProducts.filter((p: Product) => p.is_new_arrival));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    try {
      await axios.post(`${API_URL}/api/seed`);
      await fetchProducts();
    } catch (error) {
      console.error('Error seeding products:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProducts();
      // If no products, seed them
      if (products.length === 0) {
        await seedProducts();
      }
    };
    init();
  }, []);

  // Refresh after initial load if still no products
  useEffect(() => {
    if (!loading && products.length === 0) {
      seedProducts();
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, []);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const categories = [
    { id: 'sarees', name: 'Sarees', icon: 'flower-outline' },
    { id: 'dress_materials', name: 'Dress Materials', icon: 'cut-outline' },
    { id: 'readymade_dresses', name: 'Readymade', icon: 'shirt-outline' },
  ];

  const renderProductCard = (product: Product, index: number) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <View style={[styles.productImagePlaceholder, { backgroundColor: product.variants[0]?.color_code || COLORS.primary }]}>
          <Ionicons name="shirt-outline" size={40} color={COLORS.white} />
        </View>
        {product.is_new_arrival && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        {product.original_price && product.original_price > product.price && (
          <View style={styles.saleBadge}>
            <Text style={styles.badgeText}>
              {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.productFabric} numberOfLines={1}>
          {product.fabric || product.category.replace('_', ' ')}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.original_price && product.original_price > product.price && (
            <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
          )}
        </View>
        <View style={styles.colorDots}>
          {product.variants.slice(0, 4).map((variant, idx) => (
            <View
              key={idx}
              style={[styles.colorDot, { backgroundColor: variant.color_code }]}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Vastrakala...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>VASTRAKALA</Text>
            <Text style={styles.tagline}>Ethnic Elegance</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>New Collection</Text>
            <Text style={styles.heroSubtitle}>Festive Season 2025</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/categories')}>
              <Text style={styles.heroButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${category.id}`)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Collection</Text>
              <TouchableOpacity onPress={() => router.push('/categories')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featuredProducts.map((product, index) => renderProductCard(product, index))}
            </ScrollView>
          </View>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <TouchableOpacity onPress={() => router.push('/categories')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {newArrivals.map((product, index) => renderProductCard(product, index))}
            </ScrollView>
          </View>
        )}

        {/* Special Offers Banner */}
        <View style={styles.offerBanner}>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>Special Offer</Text>
            <Text style={styles.offerSubtitle}>Up to 40% Off on Silk Sarees</Text>
            <Text style={styles.offerCode}>Use code: SILK40</Text>
          </View>
        </View>

        {/* Footer Padding */}
        <View style={{ height: 20 }} />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 2,
    marginTop: 2,
  },
  searchButton: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    width: (width - 64) / 3,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  productCard: {
    width: 160,
    marginHorizontal: 6,
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
    marginLeft: 8,
  },
  colorDots: {
    flexDirection: 'row',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offerBanner: {
    marginHorizontal: 20,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 20,
  },
  offerContent: {
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  offerCode: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
});

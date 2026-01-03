import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

interface ProductVariant {
  color: string;
  color_code: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
  sizes: string[];
  variants: ProductVariant[];
  main_image: string;
  fabric?: string;
  occasion?: string;
  is_featured: boolean;
  is_new_arrival: boolean;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${id}`);
      setProduct(response.data);
      if (response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      if (response.data.variants.length > 0) {
        setSelectedColor(response.data.variants[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size before adding to cart');
      return;
    }
    if (!selectedColor) {
      Alert.alert('Select Color', 'Please select a color before adding to cart');
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(`${API_URL}/api/cart`, {
        product_id: product.id,
        product_name: product.name,
        product_image: product.main_image,
        price: product.price,
        size: selectedSize,
        color: selectedColor.color_code,
        quantity: 1,
      });
      Alert.alert('Success', 'Item added to cart!', [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') },
      ]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="heart-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: selectedColor?.color_code || COLORS.primary }]}>
          <Ionicons name="shirt-outline" size={100} color={COLORS.white} />
          {product.is_new_arrival && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.badgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category}>
            {product.category.replace('_', ' ').toUpperCase()}
            {product.subcategory && ` • ${product.subcategory.toUpperCase()}`}
          </Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.original_price && product.original_price > product.price && (
              <>
                <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>Save {formatPrice(product.original_price - product.price)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsRow}>
            {product.fabric && (
              <View style={styles.detailItem}>
                <Ionicons name="layers-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.detailText}>{product.fabric}</Text>
              </View>
            )}
            {product.occasion && (
              <View style={styles.detailItem}>
                <Ionicons name="sparkles-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.detailText}>{product.occasion}</Text>
              </View>
            )}
          </View>

          {/* Color Selection */}
          {product.variants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color: {selectedColor?.color}</Text>
              <View style={styles.colorOptions}>
                {product.variants.map((variant, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: variant.color_code },
                      selectedColor?.color === variant.color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(variant)}
                  >
                    {selectedColor?.color === variant.color && (
                      <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Size Selection */}
          {product.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Size: {selectedSize}</Text>
              <View style={styles.sizeOptions}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeOption,
                      selectedSize === size && styles.sizeOptionSelected,
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        selectedSize === size && styles.sizeTextSelected,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>100% Authentic</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="refresh-outline" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Easy Returns</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="car-outline" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Free Shipping</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={addToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="cart" size={22} color={COLORS.white} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  category: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  saveBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  saveText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.text,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeOption: {
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  sizeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sizeText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  sizeTextSelected: {
    color: COLORS.white,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: 'center',
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
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

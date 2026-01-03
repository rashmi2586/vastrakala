import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const categories = [
  {
    id: 'sarees',
    name: 'Sarees',
    description: 'Traditional & Designer Sarees',
    icon: 'flower-outline',
    color: '#8B1538',
    subcategories: ['Silk', 'Cotton', 'Chiffon', 'Georgette'],
  },
  {
    id: 'dress_materials',
    name: 'Dress Materials',
    description: 'Unstitched Suits & Fabrics',
    icon: 'cut-outline',
    color: '#2E5090',
    subcategories: ['Chanderi', 'Cotton', 'Silk', 'Embroidered'],
  },
  {
    id: 'readymade_dresses',
    name: 'Readymade Dresses',
    description: 'Kurtas, Anarkalis & More',
    icon: 'shirt-outline',
    color: '#006D5B',
    subcategories: ['Anarkali', 'Kurti', 'Palazzo Set', 'Sharara', 'Lehenga'],
  },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductCounts();
  }, []);

  const fetchProductCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      const products = response.data;
      const counts: Record<string, number> = {};
      
      categories.forEach((cat) => {
        counts[cat.id] = products.filter((p: any) => p.category === cat.id).length;
      });
      
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching product counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <Text style={styles.headerSubtitle}>Explore our collection</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => router.push(`/category/${category.id}`)}
            activeOpacity={0.8}
          >
            <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
              <Ionicons name={category.icon as any} size={40} color={COLORS.white} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
              ) : (
                <Text style={styles.productCount}>
                  {productCounts[category.id] || 0} Products
                </Text>
              )}
              <View style={styles.subcategoriesContainer}>
                {category.subcategories.slice(0, 3).map((sub, index) => (
                  <View key={sub} style={styles.subcategoryTag}>
                    <Text style={styles.subcategoryText}>{sub}</Text>
                  </View>
                ))}
                {category.subcategories.length > 3 && (
                  <View style={styles.subcategoryTag}>
                    <Text style={styles.subcategoryText}>+{category.subcategories.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}

        {/* All Products Section */}
        <TouchableOpacity
          style={[styles.categoryCard, styles.allProductsCard]}
          onPress={() => router.push('/category/all')}
          activeOpacity={0.8}
        >
          <View style={[styles.categoryIconContainer, { backgroundColor: COLORS.secondary }]}>
            <Ionicons name="sparkles" size={40} color={COLORS.text} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>All Products</Text>
            <Text style={styles.categoryDescription}>Browse entire collection</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allProductsCard: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  productCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  subcategoryTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  subcategoryText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
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

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  fabric?: string;
  occasion?: string;
  is_new_arrival: boolean;
  variants: { color: string; color_code: string }[];
}

interface FilterOptions {
  fabrics: string[];
  occasions: string[];
  price_range: { min_price: number; max_price: number };
}

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState((q as string) || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (q) {
      setSearchQuery(q as string);
      searchProducts(q as string);
    }
  }, [q]);

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/filters`);
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const searchProducts = async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query || searchQuery) params.append('search', query || searchQuery);
      if (selectedFabric) params.append('fabric', selectedFabric);
      if (selectedOccasion) params.append('occasion', selectedOccasion);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (sortBy) params.append('sort_by', sortBy);

      const response = await axios.get(`${API_URL}/api/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchProducts();
  };

  const applyFilters = () => {
    setShowFilters(false);
    searchProducts();
  };

  const clearFilters = () => {
    setSelectedFabric('');
    setSelectedOccasion('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
  };

  const formatPrice = (price: number) => {
    return `\u20b9${price.toLocaleString('en-IN')}`;
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
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productFabric} numberOfLines={1}>
          {item.fabric || item.category.replace('_', ' ')}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {item.original_price && item.original_price > item.price && (
            <Text style={styles.originalPrice}>{formatPrice(item.original_price)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeFiltersCount = [selectedFabric, selectedOccasion, minPrice, maxPrice, sortBy].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus={!q}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color={COLORS.text} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No products found' : 'Search for products'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try different keywords or filters' : 'Enter keywords to find what you need'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={products}
          renderItem={renderProduct}
          numColumns={2}
          estimatedItemSize={280}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>{products.length} products found</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.optionsRow}>
                  {[
                    { value: '', label: 'Relevance' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' },
                    { value: 'newest', label: 'Newest First' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionChip, sortBy === option.value && styles.optionChipSelected]}
                      onPress={() => setSortBy(option.value)}
                    >
                      <Text style={[styles.optionChipText, sortBy === option.value && styles.optionChipTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fabric */}
              {filterOptions?.fabrics && filterOptions.fabrics.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Fabric</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionChip, !selectedFabric && styles.optionChipSelected]}
                      onPress={() => setSelectedFabric('')}
                    >
                      <Text style={[styles.optionChipText, !selectedFabric && styles.optionChipTextSelected]}>All</Text>
                    </TouchableOpacity>
                    {filterOptions.fabrics.map((fabric) => (
                      <TouchableOpacity
                        key={fabric}
                        style={[styles.optionChip, selectedFabric === fabric && styles.optionChipSelected]}
                        onPress={() => setSelectedFabric(fabric)}
                      >
                        <Text style={[styles.optionChipText, selectedFabric === fabric && styles.optionChipTextSelected]}>
                          {fabric}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Occasion */}
              {filterOptions?.occasions && filterOptions.occasions.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Occasion</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionChip, !selectedOccasion && styles.optionChipSelected]}
                      onPress={() => setSelectedOccasion('')}
                    >
                      <Text style={[styles.optionChipText, !selectedOccasion && styles.optionChipTextSelected]}>All</Text>
                    </TouchableOpacity>
                    {filterOptions.occasions.map((occasion) => (
                      <TouchableOpacity
                        key={occasion}
                        style={[styles.optionChip, selectedOccasion === occasion && styles.optionChipSelected]}
                        onPress={() => setSelectedOccasion(occasion)}
                      >
                        <Text style={[styles.optionChipText, selectedOccasion === occasion && styles.optionChipTextSelected]}>
                          {occasion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                <View style={styles.priceInputsRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <Text style={styles.priceSeparator}>to</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 8,
  },
  searchBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  optionChipTextSelected: {
    color: COLORS.white,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: COLORS.textLight,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

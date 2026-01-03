import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = [
  { id: 'sarees', name: 'Sarees' },
  { id: 'dress_materials', name: 'Dress Materials' },
  { id: 'readymade_dresses', name: 'Readymade Dresses' },
];

const OCCASIONS = ['Wedding', 'Festive', 'Casual', 'Party', 'Daily Wear', 'Bridal'];

const DEFAULT_COLORS = [
  { color: 'Red', color_code: '#FF0000' },
  { color: 'Maroon', color_code: '#800000' },
  { color: 'Pink', color_code: '#FF69B4' },
  { color: 'Blue', color_code: '#0000FF' },
  { color: 'Navy Blue', color_code: '#000080' },
  { color: 'Green', color_code: '#008000' },
  { color: 'Yellow', color_code: '#FFD700' },
  { color: 'Orange', color_code: '#FFA500' },
  { color: 'Purple', color_code: '#800080' },
  { color: 'Black', color_code: '#000000' },
  { color: 'White', color_code: '#FFFFFF' },
  { color: 'Beige', color_code: '#F5F5DC' },
];

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: 'sarees',
    subcategory: '',
    fabric: '',
    occasion: '',
    is_featured: false,
    is_new_arrival: true,
  });
  const [sizes, setSizes] = useState<string[]>(['Free Size']);
  const [selectedColors, setSelectedColors] = useState<typeof DEFAULT_COLORS>([]);
  const [mainImage, setMainImage] = useState<string>('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setMainImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const toggleColor = (colorItem: typeof DEFAULT_COLORS[0]) => {
    if (selectedColors.find(c => c.color === colorItem.color)) {
      setSelectedColors(selectedColors.filter(c => c.color !== colorItem.color));
    } else {
      setSelectedColors([...selectedColors, colorItem]);
    }
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter(s => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const validateForm = () => {
    if (!product.name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return false;
    }
    if (!product.price || parseFloat(product.price) <= 0) {
      Alert.alert('Error', 'Please enter valid price');
      return false;
    }
    if (!product.description.trim()) {
      Alert.alert('Error', 'Please enter product description');
      return false;
    }
    if (selectedColors.length === 0) {
      Alert.alert('Error', 'Please select at least one color');
      return false;
    }
    if (sizes.length === 0) {
      Alert.alert('Error', 'Please select at least one size');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price),
        original_price: product.original_price ? parseFloat(product.original_price) : null,
        category: product.category,
        subcategory: product.subcategory || null,
        fabric: product.fabric || null,
        occasion: product.occasion || null,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
        sizes: sizes,
        variants: selectedColors.map(c => ({ color: c.color, color_code: c.color_code, images: [] })),
        main_image: mainImage,
      };

      await axios.post(`${API_URL}/api/products`, productData);
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'Add Another', onPress: resetForm },
        { text: 'View Products', onPress: () => router.push('/admin/products') },
      ]);
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProduct({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category: 'sarees',
      subcategory: '',
      fabric: '',
      occasion: '',
      is_featured: false,
      is_new_arrival: true,
    });
    setSizes(['Free Size']);
    setSelectedColors([]);
    setMainImage('');
  };

  const sizeOptions = product.category === 'sarees' || product.category === 'dress_materials'
    ? ['Free Size', 'Unstitched']
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Image</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {mainImage ? (
                <View style={styles.imagePreview}>
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                  <Text style={styles.imageText}>Image Selected</Text>
                  <Text style={styles.changeText}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textLight} />
                  <Text style={styles.imageText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Banarasi Silk Saree"
              placeholderTextColor={COLORS.textLight}
              value={product.name}
              onChangeText={(text) => setProduct({ ...product, name: text })}
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the product..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={4}
              value={product.description}
              onChangeText={(text) => setProduct({ ...product, description: text })}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2999"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={product.price}
                  onChangeText={(text) => setProduct({ ...product, price: text })}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Original Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3999 (for discount)"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={product.original_price}
                  onChangeText={(text) => setProduct({ ...product, original_price: text })}
                />
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    product.category === cat.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setProduct({ ...product, category: cat.id })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    product.category === cat.id && styles.categoryChipTextSelected,
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Subcategory</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Silk, Cotton, Anarkali"
              placeholderTextColor={COLORS.textLight}
              value={product.subcategory}
              onChangeText={(text) => setProduct({ ...product, subcategory: text })}
            />
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            
            <Text style={styles.label}>Fabric</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Pure Silk, Cotton, Georgette"
              placeholderTextColor={COLORS.textLight}
              value={product.fabric}
              onChangeText={(text) => setProduct({ ...product, fabric: text })}
            />

            <Text style={styles.label}>Occasion</Text>
            <View style={styles.occasionContainer}>
              {OCCASIONS.map((occ) => (
                <TouchableOpacity
                  key={occ}
                  style={[
                    styles.occasionChip,
                    product.occasion === occ && styles.occasionChipSelected,
                  ]}
                  onPress={() => setProduct({ ...product, occasion: occ })}
                >
                  <Text style={[
                    styles.occasionChipText,
                    product.occasion === occ && styles.occasionChipTextSelected,
                  ]}>
                    {occ}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sizes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Sizes *</Text>
            <View style={styles.sizeContainer}>
              {sizeOptions.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    sizes.includes(size) && styles.sizeChipSelected,
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={[
                    styles.sizeChipText,
                    sizes.includes(size) && styles.sizeChipTextSelected,
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Colors *</Text>
            <View style={styles.colorContainer}>
              {DEFAULT_COLORS.map((colorItem) => (
                <TouchableOpacity
                  key={colorItem.color}
                  style={[
                    styles.colorChip,
                    { backgroundColor: colorItem.color_code },
                    selectedColors.find(c => c.color === colorItem.color) && styles.colorChipSelected,
                  ]}
                  onPress={() => toggleColor(colorItem)}
                >
                  {selectedColors.find(c => c.color === colorItem.color) && (
                    <Ionicons name="checkmark" size={18} color={colorItem.color_code === '#FFFFFF' ? COLORS.text : COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedColorsText}>
              Selected: {selectedColors.map(c => c.color).join(', ') || 'None'}
            </Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Tags</Text>
            <View style={styles.tagContainer}>
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  product.is_featured && styles.tagChipSelected,
                ]}
                onPress={() => setProduct({ ...product, is_featured: !product.is_featured })}
              >
                <Ionicons
                  name={product.is_featured ? 'star' : 'star-outline'}
                  size={16}
                  color={product.is_featured ? COLORS.white : COLORS.secondary}
                />
                <Text style={[
                  styles.tagChipText,
                  product.is_featured && styles.tagChipTextSelected,
                ]}>
                  Featured
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  product.is_new_arrival && styles.tagChipSelected,
                ]}
                onPress={() => setProduct({ ...product, is_new_arrival: !product.is_new_arrival })}
              >
                <Ionicons
                  name={product.is_new_arrival ? 'sparkles' : 'sparkles-outline'}
                  size={16}
                  color={product.is_new_arrival ? COLORS.white : COLORS.success}
                />
                <Text style={[
                  styles.tagChipText,
                  product.is_new_arrival && styles.tagChipTextSelected,
                ]}>
                  New Arrival
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Add Product</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
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
  imageUpload: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePreview: {
    alignItems: 'center',
  },
  imageText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
  },
  occasionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  occasionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  occasionChipSelected: {
    backgroundColor: COLORS.secondary,
  },
  occasionChipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  occasionChipTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeChip: {
    minWidth: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  sizeChipSelected: {
    backgroundColor: COLORS.primary,
  },
  sizeChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sizeChipTextSelected: {
    color: COLORS.white,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  colorChipSelected: {
    borderColor: COLORS.text,
    borderWidth: 3,
  },
  selectedColorsText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: 'row',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 12,
  },
  tagChipSelected: {
    backgroundColor: COLORS.primary,
  },
  tagChipText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 6,
  },
  tagChipTextSelected: {
    color: COLORS.white,
  },
  submitContainer: {
    padding: 16,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

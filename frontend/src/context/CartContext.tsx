import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = user?.id || 'guest';

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cart?user_id=${userId}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      await axios.post(`${API_URL}/api/cart`, { ...item, user_id: userId });
      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeItem(itemId);
        return;
      }
      await axios.put(`${API_URL}/api/cart/${itemId}`, { quantity });
      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await axios.delete(`${API_URL}/api/cart/${itemId}`);
      await refreshCart();
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/api/cart?user_id=${userId}`);
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

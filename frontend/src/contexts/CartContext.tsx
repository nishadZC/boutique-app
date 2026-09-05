import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Product } from '../types';
import { useToast } from './ToastContext';

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; selectedSize?: string } }
  | { type: 'REMOVE_ITEM'; payload: { id: string; selectedSize?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; selectedSize?: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const loadInitialState = (): CartState => {
  try {
    const savedCart = localStorage.getItem('boutique_cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Failed to parse cart from local storage', error);
  }
  return {
    items: [],
    total: 0,
    itemCount: 0,
  };
};

const initialState: CartState = loadInitialState();

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.product.id && item.selectedSize === action.payload.selectedSize);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.product.id && item.selectedSize === action.payload.selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        };
      }
      
      const newItems = [...state.items, { ...action.payload.product, selectedSize: action.payload.selectedSize, quantity: 1 }];
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.id || item.selectedSize !== action.payload.selectedSize);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, selectedSize, quantity } = action.payload;
      
      if (quantity === 0) {
        const newItems = state.items.filter(item => item.id !== id || item.selectedSize !== selectedSize);
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems),
          itemCount: calculateItemCount(newItems),
        };
      }
      
      const newItems = state.items.map(item =>
        item.id === id && item.selectedSize === selectedSize ? { ...item, quantity } : item
      );
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems),
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        itemCount: 0,
      };
    
    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number =>
  items.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return total + (price * item.quantity);
  }, 0);

const calculateItemCount = (items: CartItem[]): number =>
  items.reduce((count, item) => count + item.quantity, 0);

interface CartContextType extends CartState {
  addItem: (product: Product, selectedSize?: string, showFeedback?: boolean) => boolean;
  removeItem: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, selectedSize: string | undefined, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('boutique_cart', JSON.stringify(state));
    } else {
      if (state.items.length > 0 || state.total > 0 || state.itemCount > 0) {
        dispatch({ type: 'CLEAR_CART' });
      }
      localStorage.removeItem('boutique_cart');
    }
  }, [state, isAuthenticated]);

  const addItem = (product: Product, selectedSize?: string, showFeedback = true): boolean => {
    if (!isAuthenticated) {
      showToast('Please sign in to add products to your cart.', 'warning');
      navigate('/login');
      return false;
    }
    dispatch({ type: 'ADD_ITEM', payload: { product, selectedSize } });
    if (showFeedback) showToast(`${product.name} added to your cart.`, 'success');
    return true;
  };

  const removeItem = (productId: string, selectedSize?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id: productId, selectedSize } });
  };

  const updateQuantity = (productId: string, selectedSize: string | undefined, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, selectedSize, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{ ...state, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
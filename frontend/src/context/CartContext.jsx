import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total_items: 0, subtotal: 0.0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart whenever user becomes authenticated
  const fetchCart = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cart/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.warn('Error fetching cart:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCart();
    } else {
      setCart({ items: [], total_items: 0, subtotal: 0.0 });
    }
  }, [isAuthenticated, accessToken]);

  // Add Item to Cart (supports productId, variantId, quantity, gsm)
  const addToCart = async (productId, variantId = null, quantity = 1, gsm = null) => {
    if (!accessToken) return { success: false, error: 'Unauthenticated' };
    
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          gsm: gsm,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add item to cart.');
      }

      setCart(data.cart);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Cart Item Quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!accessToken || quantity < 1) return { success: false };
    
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${itemId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quantity.');

      setCart(data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (itemId) => {
    if (!accessToken) return { success: false };
    
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${itemId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove item.');

      setCart(data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Clear Entire Cart
  const clearCart = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cart/clear/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch (err) {
      console.warn('Error clearing cart:', err);
    }
  };


  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart.total_items || 0,
        subtotal: cart.subtotal || 0.0,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

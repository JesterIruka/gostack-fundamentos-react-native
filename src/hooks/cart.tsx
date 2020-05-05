import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (cart) {
        setProducts(JSON.parse(cart) as Product[]);
      }
    }

    loadProducts();
  }, []);

  const save = useCallback(async () => {
    await AsyncStorage.setItem('@GoMarketplace:cart', JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async (product: Product) => {
      const reformed = [...products, { ...product, quantity: 1 }];
      setProducts(reformed);
      await save();
    },
    [products, save],
  );

  const increment = useCallback(
    async id => {
      const reformed = products.map(p =>
        p.id === id ? { ...p, quantity: p?.quantity + 1 } : p,
      );
      setProducts(reformed);
      await save();
    },
    [products, save],
  );

  const decrement = useCallback(
    async id => {
      const reformed = products.map(p =>
        p.id === id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p,
      );
      setProducts(reformed);
      await save();
    },
    [products, save],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

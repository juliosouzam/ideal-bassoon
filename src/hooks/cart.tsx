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
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem(
        '@GoMarketplace:cartProducts',
      );

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function setProductStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    }

    setProductStorage();
  }, [products]);

  const addToCart = useCallback(async product => {
    setProducts(prevState => {
      const findProduct = prevState.find(prod => prod.id === product.id);

      if (!findProduct) {
        return [...prevState, { ...product, quantity: 1 }];
      }

      const quantity = findProduct.quantity + 1;

      return prevState.map(prod =>
        prod.id === product.id ? { ...prod, quantity } : prod,
      );
    });
  }, []);

  const increment = useCallback(async id => {
    setProducts(prevState =>
      prevState.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      ),
    );
  }, []);

  const decrement = useCallback(async id => {
    setProducts(prevState => {
      const findProduct = prevState.find(product => product.id === id);

      if (findProduct && findProduct.quantity <= 0) {
        return prevState;
      }

      return prevState.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
    });
  }, []);

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

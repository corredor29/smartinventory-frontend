import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Order } from '../types/order';
import { useAuth } from './AuthContext';

const ORDERS_STORAGE_KEY = 'smart_inventory_orders';

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrderByInvoiceId: (invoiceId: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
  }, [allOrders]);

  const orders = useMemo(
    () =>
      user
        ? allOrders
            .filter((order) => order.userId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [allOrders, user],
  );

  const addOrder = useCallback((order: Order) => {
    setAllOrders((prev) => [order, ...prev]);
  }, []);

  const getOrderById = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders],
  );

  const getOrderByInvoiceId = useCallback(
    (invoiceId: string) => orders.find((order) => order.invoiceId === invoiceId),
    [orders],
  );

  return (
    <OrdersContext.Provider value={{ orders, addOrder, getOrderById, getOrderByInvoiceId }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders debe ser utilizado dentro de un OrdersProvider');
  }
  return context;
};

export function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${date}-${seq}`;
}

export function generateInvoiceId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRE-FAC-${date}-${seq}`;
}

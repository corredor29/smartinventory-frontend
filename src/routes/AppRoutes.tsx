import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { type UserRole } from '../context/AuthContext';
import { AdvisorAlertProvider } from '../context/AdvisorAlertContext';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { UsersPage } from '../pages/users/UsersPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { MovementsPage } from '../pages/inventory/MovementsPage';
import { SalesPage } from '../pages/sales/SalesPage';
import { InvoicesPage as AdminInvoicesPage } from '../pages/invoices/InvoicesPage';
import { InvoicesPage as ClientInvoicesPage } from '../pages/InvoicesPage';
import { CartPage } from '../pages/CartPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ChatbotPage } from '../pages/ChatbotPage';
import { SupportPage } from '../pages/SupportPage';
import Error404 from '../pages/errors/Error404';
import RateLimit429 from '../pages/errors/RateLimit429';
import Unauthorized from '../pages/errors/Unauthorized';

const STAFF_ROLES: UserRole[] = ['admin', 'asesor', 'Admin', 'Operator'];
const ADMIN_ROLES: UserRole[] = ['admin', 'Admin'];

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AdvisorAlertProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />

        <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/facturas" element={<ClientInvoicesPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/invoices" element={<AdminInvoicesPage />} />
          <Route path="/movimientos" element={<MovementsPage />} />
          <Route path="/inventory-movements" element={<MovementsPage />} />
          <Route path="/support" element={<SupportPage />} />
          {/* Alias de rutas antiguas del layout táctico */}
          <Route path="/armeria" element={<ProductsPage />} />
          <Route path="/ventas" element={<SalesPage />} />
          <Route path="/economia" element={<AdminInvoicesPage />} />
          <Route path="/killjoy-bot" element={<ChatbotPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/almacenamiento" element={<InventoryPage />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/error-404" element={<Error404 />} />
        <Route path="/error-429" element={<RateLimit429 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
      </AdvisorAlertProvider>
    </BrowserRouter>
  );
};

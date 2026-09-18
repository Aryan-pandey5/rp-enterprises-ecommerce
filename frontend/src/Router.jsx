import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Route Protection Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Shared Components
import NotFoundPage from './components/NotFoundPage';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminLogin from './pages/auth/AdminLogin';

// Public Storefront & Product Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Contact from './pages/Contact';
import About from './pages/About';
import Placeholder from './pages/Placeholder';

// Customer Dashboard Pages
import Profile from './pages/dashboard/Profile';
import CustomerOrders from './pages/dashboard/Orders';
import CustomerOrderDetail from './pages/dashboard/OrderDetail';
import Notifications from './pages/dashboard/Notifications';

// Admin Portal Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminCustomers from './pages/admin/Customers';
import AdminCustomerDetail from './pages/admin/CustomerDetail';
import StockInventory from './pages/admin/StockInventory';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import GSMPrices from './pages/admin/GSMPrices';

// Central application route configuration using createBrowserRouter.
const router = createBrowserRouter([
  // Public & Customer Storefront Routes (wrapped in RootLayout)
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
      {
        path: 'products',
        element: <Shop section="ALL" />,
      },
      {
        path: 'shop',
        element: <Shop section="ALL" />,
      },
      {
        path: 'disposable-products',
        element: <Shop section="DISPOSABLE" />,
      },
      {
        path: 'raw-materials',
        element: <Shop section="RAW_MATERIAL" />,
      },
      {
        path: 'products/:id',
        element: <ProductDetail />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },

      // Protected Customer Routes (requires customer authentication)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'profile',
            element: <Profile />,
          },
          {
            path: 'cart',
            element: <Cart />,
          },
          {
            path: 'checkout',
            element: <Checkout />,
          },
          {
            path: 'order-success/:orderId',
            element: <OrderSuccess />,
          },
          {
            path: 'orders',
            element: <CustomerOrders />,
          },
          {
            path: 'orders/:id',
            element: <CustomerOrderDetail />,
          },
          {
            path: 'notifications',
            element: <Notifications />,
          },
        ],
      },

      // Wildcard Storefront 404 Catch-All Route
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // Unprotected Admin Login Route
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },

  // Protected Admin Portal Routes (requires staff/admin privileges)
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'notifications',
            element: <Notifications />,
          },
          {
            path: 'orders',
            element: <AdminOrders />,
          },
          {
            path: 'orders/:id',
            element: <AdminOrderDetail />,
          },
          {
            path: 'stock',
            element: <StockInventory />,
          },
          {
            path: 'customers',
            element: <AdminCustomers />,
          },
          {
            path: 'customers/:id',
            element: <AdminCustomerDetail />,
          },
          {
            path: 'products',
            element: <AdminProducts />,
          },
          {
            path: 'categories',
            element: <AdminCategories />,
          },
          {
            path: 'gsm-prices',
            element: <GSMPrices />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);

export default router;

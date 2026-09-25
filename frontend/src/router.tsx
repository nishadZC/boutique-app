import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/layout/Layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute/AdminRoute';
import RouteError from './components/common/RouteError/RouteError';
import { ROUTES } from './constants/routes';
import { Providers } from './Providers';

import Home            from './pages/Home/Home';
import Products        from './pages/Products/Products';
import ProductDetail   from './pages/ProductDetail/ProductDetail';
import Cart            from './pages/Cart/Cart';
import Wishlist        from './pages/Wishlist/Wishlist';
import Orders          from './pages/Orders/Orders';
import Profile         from './pages/Profile/Profile';
import SkinToneAdvisor from './pages/SkinToneAdvisor/SkinToneAdvisor';

// The admin area is code-split so shoppers never download it.
const AdminLayout       = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard    = lazy(() => import('./pages/Admin/Dashboard/AdminDashboard'));
const AdminOrders       = lazy(() => import('./pages/Admin/Orders/AdminOrders'));
const AdminOrderDetail  = lazy(() => import('./pages/Admin/Orders/AdminOrderDetail'));
const AdminProducts     = lazy(() => import('./pages/Admin/Products/AdminProducts'));
const AdminProductForm  = lazy(() => import('./pages/Admin/Products/AdminProductForm'));
const AdminInventory    = lazy(() => import('./pages/Admin/Inventory/AdminInventory'));
const AdminCustomers    = lazy(() => import('./pages/Admin/Customers/AdminCustomers'));

const loading = <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><CircularProgress color="secondary" /></Box>;
const admin = (node: React.ReactNode) => <Suspense fallback={loading}>{node}</Suspense>;

// No dedicated /login or /register routes - LoginModal (global, via
// AuthModalContext) handles both in place, on whatever page triggered it.
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Providers />} errorElement={<RouteError />}>
      <Route path={ROUTES.HOME} element={<Layout />}>
        <Route index                                  element={<Home />} />
        <Route path="products"                        element={<Products />} />
        <Route path="products/:id"                    element={<ProductDetail />} />
        <Route path="style-advisor"                   element={<SkinToneAdvisor />} />

        <Route path="cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="orders"   element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      </Route>

      <Route path="admin" element={<AdminRoute>{admin(<AdminLayout />)}</AdminRoute>}>
        <Route index                  element={admin(<AdminDashboard />)} />
        <Route path="orders"          element={admin(<AdminOrders />)} />
        <Route path="orders/:id"      element={admin(<AdminOrderDetail />)} />
        <Route path="products"        element={admin(<AdminProducts />)} />
        <Route path="products/new"    element={admin(<AdminProductForm />)} />
        <Route path="products/:id"    element={admin(<AdminProductForm />)} />
        <Route path="inventory"       element={admin(<AdminInventory />)} />
        <Route path="customers"       element={admin(<AdminCustomers />)} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Route>
  )
);

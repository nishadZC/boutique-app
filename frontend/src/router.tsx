import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
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

// No dedicated /login or /register routes - LoginModal (global, via
// AuthModalContext) handles both in place, on whatever page triggered it.
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Providers />}>
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

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Route>
  )
);

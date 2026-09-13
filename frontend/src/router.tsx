import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout/Layout';
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
import Login           from './pages/Login/Login';
import Register        from './pages/Register/Register';
import SkinToneAdvisor from './pages/SkinToneAdvisor/SkinToneAdvisor';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Providers />}>
      <Route path={ROUTES.LOGIN}    element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />

      <Route path={ROUTES.HOME} element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index                                  element={<Home />} />
        <Route path="products"                        element={<Products />} />
        <Route path="products/:id"                    element={<ProductDetail />} />
        <Route path="cart"                            element={<Cart />} />
        <Route path="wishlist"                        element={<Wishlist />} />
        <Route path="style-advisor"                   element={<SkinToneAdvisor />} />
        <Route path="profile"                         element={<Profile />} />
        <Route path="orders"                          element={<Orders />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Route>
  )
);

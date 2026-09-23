import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { isValidMeasurement, MEASUREMENT_LIMITS, MeasurementField } from '../utils/measurements';

export const useProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState({
    shoulder: '',
    chest: '',
    sleeve: '',
    neck: ''
  });
  const { showToast } = useToast();

  const relatedProducts: Product[] = []; // This would come from an API call

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const productData = await productService.getById(id);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product) {
      let finalSize = selectedSize;
      
      if (isCustomizing) {
        const fields = Object.keys(customMeasurements) as MeasurementField[];
        if (fields.some(field => !isValidMeasurement(field, customMeasurements[field]))) {
          showToast('Enter valid measurements within the allowed ranges.', 'warning');
          return;
        }
        finalSize = `Custom (Shoulder: ${customMeasurements.shoulder}cm, Chest: ${customMeasurements.chest}cm, Sleeve: ${customMeasurements.sleeve}cm, Neck: ${customMeasurements.neck}cm)`;
      } else if (!finalSize) {
        showToast('Please select a size before adding this item.', 'warning');
        return;
      }
      
      if (addItem(product, finalSize)) {
        for (let i = 1; i < quantity; i++) addItem(product, finalSize, false);
        setQuantity(1);
        setIsCustomizing(false);
        setSelectedSize('');
      }
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (product && newQuantity >= 1 && newQuantity <= product.inventory) {
      setQuantity(newQuantity);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isShirt = product ? (product.category.toLowerCase().includes('shirt') || product.name.toLowerCase().includes('shirt')) : false;

  return {
    product,
    loading,
    quantity,
    tabValue,
    selectedSize,
    isCustomizing,
    customMeasurements,
    relatedProducts,
    isShirt,
    navigate,
    handleAddToCart,
    handleQuantityChange,
    handleTabChange,
    setSelectedSize,
    setIsCustomizing,
    setCustomMeasurements,
    toggleWishlist,
    isInWishlist,
    measurementLimits: MEASUREMENT_LIMITS
  };
};
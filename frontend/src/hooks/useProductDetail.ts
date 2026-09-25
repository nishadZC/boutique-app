import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import {
  formatCustomSize, getTailoringFields, isValidMeasurement, MEASUREMENT_LIMITS, MeasurementField,
} from '../utils/measurements';
import { GarmentType, getGarmentType } from '../utils/productSizing';

const TAILORING_GUIDE = [{ src: '/images/size-guide/tailoring-chart.svg', alt: 'Blazer, suit and coat size chart' }];

export const SIZE_GUIDE_IMAGES: Record<GarmentType, { src: string; alt: string }[]> = {
  shirt: [
    { src: '/images/size_chart.jpg', alt: 'Shirt size chart' },
    { src: '/images/measurement_guide.jpg', alt: 'Shirt measurement guide' },
  ],
  trousers: [
    { src: '/images/size-guide/trousers-chart.svg', alt: 'Trousers size chart' },
    { src: '/images/size-guide/trousers-diagram.svg', alt: 'Trousers measurement guide' },
  ],
  shoes: [
    { src: '/images/size-guide/shoes-chart.svg', alt: 'Shoes size chart' },
    { src: '/images/size-guide/shoes-diagram.svg', alt: 'Shoes measurement guide' },
  ],
  blazer: TAILORING_GUIDE,
  suit: TAILORING_GUIDE,
  waistcoat: TAILORING_GUIDE,
  coat: TAILORING_GUIDE,
};

const EMPTY_MEASUREMENTS: Record<MeasurementField, string> = { shoulder: '', chest: '', sleeve: '', neck: '', length: '' };

const RELATED_COUNT = 8;

export const useProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState(EMPTY_MEASUREMENTS);
  const { showToast } = useToast();

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      setSelectedSize('');
      setIsCustomizing(false);
      setCustomMeasurements(EMPTY_MEASUREMENTS);
      setQuantity(1);

      try {
        const productData = await productService.getById(id);
        if (!cancelled) setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        navigate('/products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();
    return () => { cancelled = true; };
  }, [id, navigate]);

  // "Top picks": same-category pieces first, then the rest of the range.
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    productService.getAll()
      .then(all => {
        if (cancelled) return;
        const others = all.filter(p => p.id !== product.id && (p.inventory_quantity ?? p.inventory ?? 0) > 0);
        const sameCategory = others.filter(p => p.category === product.category);
        const rest = others.filter(p => p.category !== product.category);
        setRelatedProducts([...sameCategory, ...rest].slice(0, RELATED_COUNT));
      })
      .catch(() => { if (!cancelled) setRelatedProducts([]); });
    return () => { cancelled = true; };
  }, [product]);

  const garmentType = product ? getGarmentType(product) : null;
  const tailoringFields = getTailoringFields(garmentType);
  // Shirts can always be tailored; jackets, suits and coats only when the
  // atelier offers the piece made to measure.
  const isMadeToMeasure = !!product?.madeToMeasure && garmentType !== 'shirt';
  const canTailor = tailoringFields.length > 0 && (garmentType === 'shirt' || isMadeToMeasure);

  const handleAddToCart = () => {
    if (product) {
      let finalSize = selectedSize;
      
      if (isCustomizing) {
        if (tailoringFields.some(field => !isValidMeasurement(field, customMeasurements[field]))) {
          showToast('Enter valid measurements within the allowed ranges.', 'warning');
          return;
        }
        finalSize = formatCustomSize(tailoringFields, customMeasurements, isMadeToMeasure);
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

  const sizeGuideType = garmentType;
  const sizeGuideImages = sizeGuideType ? SIZE_GUIDE_IMAGES[sizeGuideType] : [];

  return {
    product,
    loading,
    quantity,
    selectedSize,
    isCustomizing,
    customMeasurements,
    relatedProducts,
    garmentType,
    canTailor,
    isMadeToMeasure,
    tailoringFields,
    sizeGuideType,
    sizeGuideImages,
    navigate,
    handleAddToCart,
    handleQuantityChange,
    setSelectedSize,
    setIsCustomizing,
    setCustomMeasurements,
    toggleWishlist,
    isInWishlist,
    addItem,
    measurementLimits: MEASUREMENT_LIMITS
  };
};
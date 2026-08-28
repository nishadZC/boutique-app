import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Drawer,
  useMediaQuery,
  IconButton,
  Fab,
  Pagination,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import ProductCard from '../../components/common/ProductCard';
import SearchBar from '../../components/common/SearchBar';
import FilterPanel from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import SkinToneAdvisor from '../../components/SkinToneAdvisor/SkinToneAdvisor';

const Products: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [resetKey, setResetKey] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  
  const sizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '36', '37', '38', '39', '40', '41', '42', '43', '44', '45',
    'One Size',
  ];

  useEffect(() => {
    const loadProducts = async () => {
      console.log('[Products] Starting to load products...');
      try {
        const allProducts = await productService.getAll();
        console.log('[Products] Products loaded:', allProducts.length, allProducts);
        
        const uniqueBrands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean))) as string[];
        const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))) as string[];
        const uniqueColors = Array.from(new Set(allProducts.map(p => p.color).filter(Boolean))) as string[];
        
        setBrands(uniqueBrands.sort());
        setCategories(uniqueCategories.sort());
        setColors(uniqueColors.sort());
        
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (error) {
        console.error('[Products] Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Apply active filters
    if (activeFilters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= activeFilters.priceRange[0] && product.price <= activeFilters.priceRange[1]
      );
    }

    if (activeFilters.category) {
      filtered = filtered.filter(product => 
        product.category && product.category.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }

    if (activeFilters.brand && activeFilters.brand.length > 0) {
      filtered = filtered.filter(product => 
        activeFilters.brand.includes(product.brand)
      );
    }

    if (activeFilters.inStock) {
      filtered = filtered.filter(product => product.inventory > 0);
    }

    if (activeFilters.size && activeFilters.size.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes?.some((s: string) => activeFilters.size.includes(s))
      );
    }

    if (activeFilters.color && activeFilters.color.length > 0) {
      filtered = filtered.filter(product => 
        product.color && activeFilters.color.some((c: string) => product.color!.toLowerCase() === c.toLowerCase())
      );
    }

    if (activeFilters.rating) {
      filtered = filtered.filter(product => 
        (product.rating || 0) >= activeFilters.rating
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setPage(1); // Reset to first page on filter/sort change
  }, [products, searchQuery, sortBy, activeFilters]);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <LoadingSkeleton count={12} />
        </Box>
      </Container>
    );
  }

  const maxPrice = Math.max(...products.map(p => p.price), 1000);

  const mainContent = (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          All Products
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
        </Typography>
      </Box>

      {/* Search and Controls */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, minWidth: 300 }}>
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search luxury products..."
          />
        </Box>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="featured">Featured</MenuItem>
            <MenuItem value="price-low">Price: Low to High</MenuItem>
            <MenuItem value="price-high">Price: High to Low</MenuItem>
            <MenuItem value="name">Name: A-Z</MenuItem>
            <MenuItem value="newest">Newest First</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <ViewModuleIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ViewListIcon />
          </IconButton>
        </Box>

        {!isMobile && (
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filters
          </Button>
        )}

        <Button
          variant="contained"
          startIcon={<SparkleIcon />}
          onClick={() => setAdvisorOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f4e5a0 50%, #d4af37 100%)',
            color: '#000',
            fontWeight: 700,
            ml: 'auto',
            boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #b8941f 0%, #d4af37 100%)',
              boxShadow: '0 6px 20px rgba(212,175,55,0.6)',
            }
          }}
        >
          Find My Style
        </Button>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={viewMode === 'list' ? 2 : 4}>
        {filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((product) => (
          <Grid 
            size={{
              xs: 12,
              sm: viewMode === 'list' ? 12 : 6,
              md: viewMode === 'list' ? 12 : 4,
              lg: viewMode === 'list' ? 12 : 3
            }}
            key={product.id}
          >
            <ProductCard
              product={product}
              onAddToCart={addItem}
              onToggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist(product.id)}
              variant={viewMode}
            />
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 2 }}>
          <Pagination 
            count={Math.ceil(filteredProducts.length / itemsPerPage)} 
            page={page} 
            onChange={(e, value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            color="primary" 
            size="large" 
          />
        </Box>
      )}

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found matching your criteria.
          </Typography>
          <Button variant="outlined" onClick={() => {
            setSearchQuery('');
            setSortBy('featured');
            setActiveFilters({});
            setResetKey(prev => prev + 1);
          }}>
            Clear Filters
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Filter Sidebar for Desktop */}
          {!isMobile && (
            <Grid size={{ xs: 12, md: 3 }}>
              <FilterPanel
                key={resetKey}
                onFilterChange={handleFilterChange}
                categories={categories}
                brands={brands}
                sizes={sizes}
                colors={colors}
                maxPrice={maxPrice}
              />
            </Grid>
          )}
          
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 9 }}>
            {mainContent}
          </Grid>
        </Grid>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 300 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <FilterPanel
          key={resetKey}
          onFilterChange={(filters) => {
            handleFilterChange(filters);
            setFilterDrawerOpen(false);
          }}
          categories={categories}
          brands={brands}
          sizes={sizes}
          colors={colors}
          maxPrice={maxPrice}
        />
      </Drawer>

      {/* Mobile Filter Fab */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setFilterDrawerOpen(true)}
        >
          <FilterIcon />
        </Fab>
      )}
      
      {/* Skin Tone Advisor Modal */}
      <SkinToneAdvisor open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
    </Container>
  );
};

export default Products;
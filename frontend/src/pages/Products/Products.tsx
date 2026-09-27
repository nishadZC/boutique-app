import React, { memo } from 'react';
import {
  Container, Box, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, IconButton, Button, Pagination, Drawer, Fab,
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon,
  FilterList as FilterIcon, Close as CloseIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProductCard, SearchBar, FilterPanel } from '../../components/common';
import LoadingSkeleton from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { useProducts } from '../../hooks/useProducts';
import { BRAND } from '../../constants/colors';
import styles from './Products.module.css';
import { useState, useCallback } from 'react';

const Products = memo(function Products() {
  const navigate = useNavigate();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const openDrawer  = useCallback(() => setFilterDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setFilterDrawerOpen(false), []);

  const {
    loading, pagedProducts, filteredProducts, pageCount, page,
    viewMode, setViewMode, resetKey, sortBy, activeFilters, searchQuery,
    categories, brands, sizes, colors, maxPrice,
    isInWishlist, handleSearch, handleSortChange, handleFilterChange,
    handlePageChange, handleClearFilters, handleAddToCart, handleToggleWishlist,
  } = useProducts();

  if (loading) return <Container maxWidth="lg"><Box sx={{ py: 4 }}><LoadingSkeleton count={12} /></Box></Container>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4, px: { xs: 0, lg: 2 } }}>
        <Grid container spacing={4}>
          {/* Sidebar — desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, flexShrink: 0 }}>
            <FilterPanel key={resetKey} initialCategory={activeFilters.category} initialHandcrafted={activeFilters.handcrafted} onFilterChange={handleFilterChange} categories={categories} brands={brands} sizes={sizes} colors={colors} maxPrice={maxPrice} />
          </Box>

          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                {searchQuery ? `Results for “${searchQuery}”` : activeFilters.category || (activeFilters.handcrafted ? 'Handcrafted' : null) || (sortBy === 'newest' ? 'New In' : 'All Products')}
              </Typography>
              <Typography variant="h6" color="text.secondary">{filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found</Typography>
            </Box>

            <Box className={styles.controls}>
              <Box sx={{ flexGrow: 1, minWidth: 240 }}>
                <SearchBar key={resetKey} initialQuery={searchQuery} onSearch={handleSearch} placeholder="Search luxury products…" />
              </Box>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} label="Sort By" onChange={e => handleSortChange(e.target.value)}>
                  <MenuItem value="featured">Featured</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name: A-Z</MenuItem>
                  <MenuItem value="newest">Newest First</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'} aria-label="grid view"><ViewModuleIcon /></IconButton>
                <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'} aria-label="list view"><ViewListIcon /></IconButton>
              </Box>
              <Button size="large" startIcon={<SparkleIcon />} onClick={() => navigate('/style-advisor')} className={styles.styleBtn}>
                Find My Style
              </Button>
            </Box>

            <Grid container spacing={viewMode === 'list' ? 2 : 2.5}>
              {pagedProducts.map(product => (
                <Grid key={product.id} size={{ xs: 12, sm: viewMode === 'list' ? 12 : 6, md: viewMode === 'list' ? 12 : 4, lg: viewMode === 'list' ? 12 : 3 }}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isInWishlist={isInWishlist(product.id)} variant={viewMode} />
                </Grid>
              ))}
            </Grid>

            {pageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 2 }}>
                <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" size="large" />
              </Box>
            )}

            {pagedProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>No products found.</Typography>
                <Button variant="outlined" onClick={handleClearFilters}>Clear Filters</Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Box>

      {/* Mobile drawer */}
      <Drawer anchor="left" open={filterDrawerOpen} onClose={closeDrawer} sx={{ '& .MuiDrawer-paper': { width: 300 } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">Filters</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button size="small" onClick={handleClearFilters} sx={{ mr: 1, color: 'text.secondary' }}>Clear</Button>
            <IconButton onClick={closeDrawer} size="small"><CloseIcon /></IconButton>
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          <FilterPanel key={resetKey} initialCategory={activeFilters.category} initialHandcrafted={activeFilters.handcrafted} onFilterChange={handleFilterChange} categories={categories} brands={brands} sizes={sizes} colors={colors} maxPrice={maxPrice} />
        </Box>
      </Drawer>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }} onClick={openDrawer} aria-label="filters">
        <FilterIcon />
      </Fab>
    </Container>
  );
});

export default Products;
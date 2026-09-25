import React, { memo, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Slider, FormControl, Select, MenuItem,
  Checkbox, FormControlLabel, Button, Accordion, AccordionSummary, AccordionDetails, Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';
import styles from './FilterPanel.module.css';

export interface FilterOptions {
  priceRange: [number, number];
  category: string;
  brand: string[];
  size: string[];
  color: string[];
  rating: number;
  inStock: boolean;
  /** Only pieces made by hand in the atelier. */
  handcrafted: boolean;
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  maxPrice: number;
  initialCategory?: string;
  initialHandcrafted?: boolean;
}

const FilterPanel = memo<FilterPanelProps>(function FilterPanel({ onFilterChange, categories, brands, sizes, colors, maxPrice, initialCategory = '', initialHandcrafted = false }) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, maxPrice], category: initialCategory, brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: initialHandcrafted,
  });

  const update = useCallback((patch: Partial<FilterOptions>) => {
    setFilters(prev => {
      const next = { ...prev, ...patch };
      onFilterChange(next);
      return next;
    });
  }, [onFilterChange]);

  const toggleArr = useCallback((key: 'brand' | 'size' | 'color', val: string) => {
    setFilters(prev => {
      const arr = prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val];
      const next = { ...prev, [key]: arr };
      onFilterChange(next);
      return next;
    });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    const cleared: FilterOptions = { priceRange: [0, maxPrice], category: '', brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: false };
    setFilters(cleared);
    onFilterChange(cleared);
  }, [maxPrice, onFilterChange]);

  const activeCount = [filters.category, filters.brand.length, filters.size.length, filters.color.length, filters.rating, filters.inStock, filters.handcrafted].filter(Boolean).length
    + (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0);

  return (
    <Card className={styles.card}>
      <CardContent>
        <Box className={styles.header}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
            {activeCount > 0 && <Chip label={activeCount} size="small" color="primary" />}
          </Box>
          {activeCount > 0 && <Button startIcon={<ClearIcon />} onClick={clearFilters} size="small">Clear</Button>}
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Price Range</Typography></AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2, pt: 2 }}>
              <Typography variant="body2" color="text.secondary">₹{filters.priceRange[0]} – ₹{filters.priceRange[1]}</Typography>
              <Slider value={filters.priceRange} onChange={(_, v) => update({ priceRange: v as [number, number] })} valueLabelDisplay="auto" min={0} max={maxPrice} step={50} sx={{ mt: 2 }} />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Category</Typography></AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <Select value={filters.category} onChange={e => update({ category: e.target.value })} displayEmpty>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Brand</Typography></AccordionSummary>
          <AccordionDetails>
            {brands.map(b => <FormControlLabel key={b} control={<Checkbox checked={filters.brand.includes(b)} onChange={() => toggleArr('brand', b)} size="small" />} label={b} />)}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Size</Typography></AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sizes.map(s => <Chip key={s} label={s} clickable color={filters.size.includes(s) ? 'primary' : 'default'} onClick={() => toggleArr('size', s)} size="small" />)}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Color</Typography></AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {colors.map(c => <Chip key={c} label={c} clickable color={filters.color.includes(c) ? 'primary' : 'default'} onClick={() => toggleArr('color', c)} size="small" />)}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Rating</Typography></AccordionSummary>
          <AccordionDetails>
            {[4,3,2,1].map(r => <FormControlLabel key={r} control={<Checkbox checked={filters.rating === r} onChange={() => update({ rating: filters.rating === r ? 0 : r })} size="small" />} label={`${r} Stars & Up`} />)}
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel control={<Checkbox checked={filters.inStock} onChange={() => update({ inStock: !filters.inStock })} size="small" />} label="In Stock Only" />
          <FormControlLabel control={<Checkbox checked={filters.handcrafted} onChange={() => update({ handcrafted: !filters.handcrafted })} size="small" />} label="Handcrafted only" />
        </Box>
      </CardContent>
    </Card>
  );
});

export default FilterPanel;
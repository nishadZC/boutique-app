import React, { memo, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Breadcrumbs, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText,
  InputAdornment, InputLabel, Link, MenuItem, Select, Skeleton, Switch, TextField, Typography,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminProduct, AdminProductInput } from '../../../types/admin';
import { CSS_COLORS, getHex } from '../../../constants/colors';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import StockDialog from './StockDialog';
import { StockLabel } from './AdminProducts';
import styles from '../admin.module.css';

const SKIN_TONES = [
  { value: 'very_fair', label: 'Very fair' }, { value: 'fair', label: 'Fair' },
  { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep' },
];
const MAX_IMAGE_MB = 5;

interface FormState {
  name: string; brand: string; sku: string; categoryId: string; price: string; comparePrice: string;
  shortDescription: string; description: string; materials: string; careInstructions: string;
  baseColour: string; skinToneTags: string[]; isFeatured: boolean; inventoryQuantity: string;
  isHandcrafted: boolean; madeToMeasure: boolean; makingDays: string;
}

const EMPTY: FormState = {
  name: '', brand: '', sku: '', categoryId: '', price: '', comparePrice: '', shortDescription: '', description: '',
  materials: '', careInstructions: '', baseColour: '', skinToneTags: [], isFeatured: false, inventoryQuantity: '0',
  isHandcrafted: false, madeToMeasure: false, makingDays: '',
};

const fromProduct = (p: AdminProduct): FormState => ({
  name: p.name, brand: p.brand, sku: p.sku, categoryId: p.categoryId ?? '', price: String(p.price),
  comparePrice: p.comparePrice == null ? '' : String(p.comparePrice), shortDescription: p.shortDescription,
  description: p.description, materials: p.materials, careInstructions: p.careInstructions, baseColour: p.baseColour,
  skinToneTags: p.skinToneTags, isFeatured: p.isFeatured, inventoryQuantity: String(p.inventoryQuantity),
  isHandcrafted: p.isHandcrafted, madeToMeasure: p.madeToMeasure, makingDays: p.makingDays == null ? '' : String(p.makingDays),
});

function validate(f: FormState, isNew: boolean): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const price = Number(f.price);
  if (f.name.trim().length < 2) errors.name = 'Enter a product name';
  if (!f.categoryId) errors.categoryId = 'Choose a category';
  if (!f.price || !Number.isFinite(price) || price <= 0) errors.price = 'Enter a price above ₹0';
  else if (!/^\d+(\.\d{1,2})?$/.test(f.price.trim())) errors.price = 'Use at most two decimal places';
  if (f.comparePrice) {
    const compare = Number(f.comparePrice);
    if (!Number.isFinite(compare) || compare <= price) errors.comparePrice = 'Must be higher than the price';
  }
  if (f.madeToMeasure) {
    const days = Number(f.makingDays);
    if (!f.makingDays.trim() || !Number.isInteger(days) || days < 1 || days > 120) errors.makingDays = 'Whole number of days, 1 to 120';
  }
  if (isNew) {
    const qty = Number(f.inventoryQuantity);
    if (!Number.isInteger(qty) || qty < 0) errors.inventoryQuantity = 'Whole number, 0 or more';
  }
  return errors;
}

const AdminProductForm = memo(function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockOpen, setStockOpen] = useState(false);

  useEffect(() => { adminService.listCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => {
    if (isNew) { setForm(EMPTY); setProduct(null); return; }
    setLoading(true);
    adminService.getProduct(id!)
      .then(p => { setProduct(p); setForm(fromProduct(p)); })
      .catch(err => setError(apiErrorMessage(err, 'Could not load this product')))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const errors = validate(form, isNew);
  const show = (key: keyof FormState) => (submitted && errors[key]) || undefined;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    setError(null);
    const payload: AdminProductInput = {
      name: form.name.trim(), brand: form.brand.trim(), sku: form.sku.trim(), categoryId: form.categoryId,
      price: Number(form.price), comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      shortDescription: form.shortDescription.trim(), description: form.description.trim(),
      materials: form.materials.trim(), careInstructions: form.careInstructions.trim(),
      baseColour: form.baseColour.trim(), skinToneTags: form.skinToneTags, isFeatured: form.isFeatured,
      isHandcrafted: form.isHandcrafted, madeToMeasure: form.madeToMeasure,
      makingDays: form.madeToMeasure ? Number(form.makingDays) : null,
    };
    try {
      if (isNew) {
        const created = await adminService.createProduct({ ...payload, inventoryQuantity: Number(form.inventoryQuantity) });
        showToast('Product created — add a photo next', 'success');
        navigate(`${ROUTES.ADMIN_PRODUCTS}/${created.id}`, { replace: true });
      } else {
        const updated = await adminService.updateProduct(id!, payload);
        setProduct(updated);
        setForm(fromProduct(updated));
        setSubmitted(false);
        showToast('Changes saved', 'success');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the product'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file || !product) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showToast('Use a JPEG, PNG or WebP image', 'warning'); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { showToast(`Images must be ${MAX_IMAGE_MB} MB or smaller`, 'warning'); return; }
    setUploading(true);
    try {
      const { imageUrl } = await adminService.uploadProductImage(product.id, file);
      setProduct(p => (p ? { ...p, imageUrl } : p));
      showToast('Photo updated', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not upload the photo'), 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleActive = async () => {
    if (!product) return;
    try {
      const updated = await adminService.setProductActive(product.id, !product.isActive);
      setProduct(updated);
      showToast(updated.isActive ? 'Product is back in the store' : 'Product archived — hidden from the store', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the product'), 'error');
    }
  };

  if (loading) return <Box><Skeleton height={60} /><Skeleton variant="rounded" height={420} /></Box>;
  if (!isNew && !product) return <Alert severity="error">{error ?? 'Product not found'}</Alert>;

  return (
    <Box component="form" onSubmit={save} noValidate>
      <Breadcrumbs sx={{ mb: 1, fontSize: '0.82rem' }}>
        <Link component={RouterLink} to={ROUTES.ADMIN_PRODUCTS} underline="hover" color="inherit">Products</Link>
        <Typography color="text.primary" sx={{ fontSize: '0.82rem' }}>{isNew ? 'New product' : product!.name}</Typography>
      </Breadcrumbs>
      <Box className={styles.pageHeader}>
        <Box>
          <Typography variant="h1" className={styles.title}>{isNew ? 'Add product' : 'Edit product'}</Typography>
          {!isNew && <Typography className={styles.subtitle}>{product!.isActive ? 'Visible in the store' : 'Archived — hidden from the store'}</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isNew && <Button variant="outlined" onClick={toggleActive}>{product!.isActive ? 'Archive' : 'Restore'}</Button>}
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submitted && Object.keys(errors).length > 0 && <Alert severity="warning" sx={{ mb: 2 }}>Fix the highlighted fields to continue.</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Details</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Name" required value={form.name} onChange={e => set('name', e.target.value)} error={!!show('name')} helperText={show('name')}
                sx={{ gridColumn: { sm: 'span 2' } }} slotProps={{ htmlInput: { maxLength: 255 } }} />
              <TextField label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
              <TextField label="SKU" value={form.sku} onChange={e => set('sku', e.target.value)} helperText="Must be unique" slotProps={{ htmlInput: { maxLength: 100 } }} />
              <FormControl required error={!!show('categoryId')}>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
                {show('categoryId') && <FormHelperText>{show('categoryId')}</FormHelperText>}
              </FormControl>
              <Autocomplete
                freeSolo
                options={Object.keys(CSS_COLORS)}
                value={form.baseColour}
                onInputChange={(_, v) => set('baseColour', v)}
                renderOption={(props, option) => (
                  <li {...props} key={option}><span style={{ width: 14, height: 14, marginRight: 10, background: getHex(option), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />{option}</li>
                )}
                renderInput={params => <TextField {...params} label="Colour" />}
              />
              <TextField label="Short description" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }} slotProps={{ htmlInput: { maxLength: 500 } }} />
              <TextField label="Description" multiline minRows={4} value={form.description} onChange={e => set('description', e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }} slotProps={{ htmlInput: { maxLength: 5000 } }} helperText={`${form.description.length}/5000`} />
              <TextField label="Materials" value={form.materials} onChange={e => set('materials', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
              <TextField label="Care instructions" value={form.careInstructions} onChange={e => set('careInstructions', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
            </Box>
          </Box>

          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Pricing</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Price" required value={form.price} onChange={e => set('price', e.target.value)} error={!!show('price')} helperText={show('price')}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }, htmlInput: { inputMode: 'decimal' } }} />
              <TextField label="Compare-at price" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)}
                error={!!show('comparePrice')} helperText={show('comparePrice') ?? 'Optional “was” price, shown struck through'}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }, htmlInput: { inputMode: 'decimal' } }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Photo</Typography>
            {isNew ? (
              <Typography className={styles.muted}>Create the product first, then upload its photo here.</Typography>
            ) : (
              <>
                <Box sx={{ aspectRatio: '4 / 5', background: '#f1eee9', borderRadius: 1, overflow: 'hidden', mb: 1.5 }}>
                  {product!.imageUrl && <Box component="img" src={product!.imageUrl} alt={product!.name} sx={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />}
                </Box>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => upload(e.target.files?.[0])} />
                <Button fullWidth variant="outlined" startIcon={<CloudUploadOutlined />} disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? 'Uploading…' : 'Replace photo'}
                </Button>
                <FormHelperText>JPEG, PNG or WebP, up to {MAX_IMAGE_MB} MB.</FormHelperText>
              </>
            )}
          </Box>

          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Inventory</Typography>
            {isNew ? (
              <TextField label="Opening stock" fullWidth value={form.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)}
                error={!!show('inventoryQuantity')} helperText={show('inventoryQuantity')} slotProps={{ htmlInput: { inputMode: 'numeric' } }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <StockLabel quantity={product!.inventoryQuantity} />
                <Button size="small" onClick={() => setStockOpen(true)}>Adjust stock</Button>
              </Box>
            )}
          </Box>

          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Craftsmanship</Typography>
            <FormControlLabel control={<Switch checked={form.isHandcrafted} onChange={e => set('isHandcrafted', e.target.checked)} />} label="Handcrafted (badge and Handcrafted collection)" />
            <FormControlLabel control={<Switch checked={form.madeToMeasure} onChange={e => set('madeToMeasure', e.target.checked)} />} label="Made to measure" />
            <FormHelperText sx={{ mt: 0, mb: 1.5 }}>Customers can enter their own measurements. Applies to blazers, suits, waistcoats and coats; shirts can always be tailored.</FormHelperText>
            {form.madeToMeasure && (
              <TextField label="Making time" fullWidth value={form.makingDays} onChange={e => set('makingDays', e.target.value)}
                error={!!show('makingDays')} helperText={show('makingDays') ?? 'Working days to tailor an order, shown to customers'}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">days</InputAdornment> }, htmlInput: { inputMode: 'numeric' } }} />
            )}
          </Box>

          <Box className={styles.card}>
            <Typography className={styles.cardTitle}>Merchandising</Typography>
            <FormControlLabel control={<Switch checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />} label="Featured (shown as a best seller)" />
            <Typography sx={{ mt: 2, mb: 0.5, fontSize: '0.84rem', fontWeight: 500 }}>Style Advisor skin tones</Typography>
            <FormGroup row>
              {SKIN_TONES.map(t => (
                <FormControlLabel key={t.value} label={t.label} control={
                  <Checkbox size="small" checked={form.skinToneTags.includes(t.value)}
                    onChange={e => set('skinToneTags', e.target.checked ? [...form.skinToneTags, t.value] : form.skinToneTags.filter(x => x !== t.value))} />
                } />
              ))}
            </FormGroup>
          </Box>
        </Box>
      </Box>

      {!isNew && stockOpen && (
        <StockDialog product={product} onClose={() => setStockOpen(false)}
          onSaved={quantity => { setProduct(p => (p ? { ...p, inventoryQuantity: quantity } : p)); setStockOpen(false); showToast(`Stock updated to ${quantity}`, 'success'); }} />
      )}
    </Box>
  );
});

export default AdminProductForm;

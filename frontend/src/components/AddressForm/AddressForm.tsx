import React, { memo, useState, useCallback } from 'react';
import { Alert, Button, Grid, TextField } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import { AddressFields } from '../../types/address';
import { getCurrentAddress } from '../../services/azureMapsService';

interface AddressFormProps {
  value: AddressFields;
  onChange: (value: AddressFields) => void;
}

const AddressForm = memo<AddressFormProps>(function AddressForm({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = useCallback((field: keyof AddressFields, v: string) => {
    onChange({ ...value, [field]: v });
  }, [onChange, value]);

  const useLocation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      onChange(await getCurrentAddress());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find your location');
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  return (
    <Grid container spacing={2} sx={{ width: '100%', minWidth: 0, m: 0 }}>
      <Grid size={{ xs: 12 }}>
        <Button fullWidth variant="outlined" startIcon={<MyLocationIcon />} onClick={useLocation} disabled={loading}>
          {loading ? 'Finding location…' : 'Use current location'}
        </Button>
      </Grid>
      {error && <Grid size={{ xs: 12 }}><Alert severity="warning">{error}</Alert></Grid>}
      <Grid size={{ xs: 12, sm: 4 }}><TextField label="House / Flat No." required fullWidth value={value.houseNumber} onChange={e => update('houseNumber', e.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 8 }}><TextField label="Street / Area"    required fullWidth value={value.street}      onChange={e => update('street', e.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="City"             required fullWidth value={value.city}        onChange={e => update('city', e.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="State"            required fullWidth value={value.state}       onChange={e => update('state', e.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="PIN / Postal Code" required fullWidth value={value.postalCode} onChange={e => update('postalCode', e.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="Country"          required fullWidth value={value.country}     onChange={e => update('country', e.target.value)} /></Grid>
    </Grid>
  );
});

export { AddressForm };
export default AddressForm;
import React from 'react';
import { Alert, Button, Grid, TextField } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import { AddressFields } from '../../types/address';
import { getCurrentAddress } from '../../services/azureMapsService';

interface AddressFormProps {
  value: AddressFields;
  onChange: (value: AddressFields) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ value, onChange }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const update = (field: keyof AddressFields, fieldValue: string) => onChange({ ...value, [field]: fieldValue });

  const useLocation = async () => {
    setLoading(true);
    setError('');
    try {
      onChange(await getCurrentAddress());
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Unable to find your location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={useLocation} disabled={loading}>
          {loading ? 'Finding location...' : 'Use current location'}
        </Button>
      </Grid>
      {error && <Grid size={{ xs: 12 }}><Alert severity="warning">{error}</Alert></Grid>}
      <Grid size={{ xs: 12, sm: 4 }}><TextField label="House / Flat No." required fullWidth value={value.houseNumber} onChange={event => update('houseNumber', event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 8 }}><TextField label="Street / Area" required fullWidth value={value.street} onChange={event => update('street', event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="City" required fullWidth value={value.city} onChange={event => update('city', event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="State" required fullWidth value={value.state} onChange={event => update('state', event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="PIN / Postal Code" required fullWidth value={value.postalCode} onChange={event => update('postalCode', event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField label="Country" required fullWidth value={value.country} onChange={event => update('country', event.target.value)} /></Grid>
    </Grid>
  );
};
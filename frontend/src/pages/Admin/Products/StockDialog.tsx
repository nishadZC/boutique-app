import React, { memo, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminProduct, InventoryAdjustment } from '../../../types/admin';
import { formatDateTime } from '../format';

const REASONS = [
  { value: 'restock', label: 'New stock received' },
  { value: 'correction', label: 'Stock count correction' },
  { value: 'return', label: 'Customer return' },
  { value: 'damaged', label: 'Damaged / written off' },
  { value: 'other', label: 'Other' },
];
const REASON_LABELS: Record<string, string> = {
  ...Object.fromEntries(REASONS.map(r => [r.value, r.label])), sale: 'Order paid', order_restock: 'Order cancelled / refunded',
};

interface Props { product: AdminProduct | null; onClose: () => void; onSaved: (quantity: number) => void }

/** Adjust stock with a mandatory reason; every change lands in the product's stock history. */
const StockDialog = memo(({ product, onClose, onSaved }: Props) => {
  const [mode, setMode] = useState<'adjust' | 'set'>('adjust');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<InventoryAdjustment[] | null>(null);

  useEffect(() => {
    if (!product) return;
    setMode('adjust'); setQuantity(''); setReason('restock'); setNote(''); setError(null); setHistory(null);
    adminService.inventoryHistory(product.id).then(setHistory).catch(() => setHistory([]));
  }, [product]);

  if (!product) return null;
  const n = Number(quantity);
  const valid = quantity.trim() !== '' && Number.isInteger(n) && (mode === 'set' ? n >= 0 : n !== 0);
  const resulting = mode === 'set' ? n : product.inventoryQuantity + n;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await adminService.adjustInventory(product.id, { mode, quantity: n, reason, note: note.trim() || undefined });
      onSaved(result.inventoryQuantity);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update stock'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Stock: {product.name}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Currently <strong>{product.inventoryQuantity}</strong> in stock.</Typography>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} sx={{ mb: 2 }}>
          <ToggleButton value="adjust">Add / remove</ToggleButton>
          <ToggleButton value="set">Set exact count</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, gap: 2 }}>
          <TextField
            label={mode === 'set' ? 'New count' : 'Change (+/-)'}
            type="number"
            size="small"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            helperText={valid ? `Result: ${resulting}` : mode === 'set' ? '0 or more' : 'e.g. 10 or -2'}
            error={quantity !== '' && (!valid || resulting < 0)}
            slotProps={{ htmlInput: { step: 1 } }}
          />
          <FormControl size="small">
            <InputLabel>Reason</InputLabel>
            <Select label="Reason" value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TextField fullWidth size="small" label="Note (optional)" placeholder="e.g. PO-1142" value={note} onChange={e => setNote(e.target.value)}
          sx={{ mt: 2 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Typography sx={{ mt: 3, mb: 1, fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Recent changes</Typography>
        {history === null && <Typography color="text.secondary" fontSize="0.85rem">Loading…</Typography>}
        {history?.length === 0 && <Typography color="text.secondary" fontSize="0.85rem">No stock changes recorded yet.</Typography>}
        {history?.slice(0, 8).map(h => (
          <Box key={h.id} sx={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 1, py: 0.75, borderTop: '1px solid #f0ede7', fontSize: '0.84rem' }}>
            <Typography sx={{ fontWeight: 600, color: h.delta > 0 ? '#1f5e33' : '#9b1c1c', fontSize: 'inherit' }}>{h.delta > 0 ? `+${h.delta}` : h.delta}</Typography>
            <Typography sx={{ fontSize: 'inherit' }}>{REASON_LABELS[h.reason] ?? h.reason}{h.note ? ` · ${h.note}` : ''}<br /><span style={{ color: '#8a857d' }}>{h.actor}</span></Typography>
            <Typography sx={{ fontSize: 'inherit', color: '#8a857d', textAlign: 'right' }}>{formatDateTime(h.createdAt)}<br />→ {h.resultingQuantity}</Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={!valid || resulting < 0 || saving} onClick={save}>Save stock</Button>
      </DialogActions>
    </Dialog>
  );
});

export default StockDialog;

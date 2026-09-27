import React, { memo, useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel,
  InputLabel, MenuItem, Radio, RadioGroup, Select, TextField,
} from '@mui/material';
import { Order } from '../../types';
import { CANCEL_REASONS, RETURN_REASONS, RETURN_WINDOW_DAYS } from '../../constants/orderRequests';

export type RequestKind = 'cancel' | 'return';

interface OrderRequestDialogProps {
  order: Order | null;
  kind: RequestKind;
  onClose: () => void;
  onSubmit: (
    request: { kind: 'cancel' } | { kind: 'return'; type: 'return' | 'refund' },
    reason: string,
    details: string,
  ) => Promise<boolean>;
}

/** Asks why the customer is cancelling (before delivery) or returning (after delivery). */
const OrderRequestDialog = memo<OrderRequestDialogProps>(function OrderRequestDialog({ order, kind, onClose, onSubmit }) {
  const [type, setType] = useState<'return' | 'refund'>('return');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (order) { setType('return'); setReason(''); setDetails(''); }
  }, [order, kind]);

  const cancelling = kind === 'cancel';
  const paid = order?.paymentStatus === 'paid';
  const needsDetails = reason === 'Other';
  const canSubmit = !!reason && (!needsDetails || details.trim().length >= 3) && !busy;

  const submit = async () => {
    setBusy(true);
    const ok = await onSubmit(cancelling ? { kind: 'cancel' } : { kind: 'return', type }, reason, details.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={!!order} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{cancelling ? 'Cancel this order?' : 'Return or refund'}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {cancelling
            ? paid
              ? 'Your order will be cancelled straight away and the full amount refunded to your original payment method once we process it.'
              : 'Your order will be cancelled straight away. You have not been charged.'
            : `Tell us what went wrong. Requests are accepted within ${RETURN_WINDOW_DAYS} days of delivery and are reviewed by our team before any refund.`}
        </DialogContentText>
        {!cancelling && (
          <RadioGroup row value={type} onChange={e => setType(e.target.value as 'return' | 'refund')} sx={{ mb: 1 }}>
            <FormControlLabel value="return" control={<Radio size="small" />} label="Return the item" />
            <FormControlLabel value="refund" control={<Radio size="small" />} label="Refund only" />
          </RadioGroup>
        )}
        <FormControl fullWidth size="small" required sx={{ mb: 2 }}>
          <InputLabel>Reason</InputLabel>
          <Select label="Reason" value={reason} onChange={e => setReason(e.target.value)}>
            {(cancelling ? CANCEL_REASONS : RETURN_REASONS).map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          fullWidth multiline minRows={3} size="small"
          label={needsDetails ? 'Tell us more' : 'Anything else? (optional)'}
          required={needsDetails}
          value={details}
          onChange={e => setDetails(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>{cancelling ? 'Keep order' : 'Back'}</Button>
        <Button variant="contained" color={cancelling ? 'error' : 'primary'} disabled={!canSubmit} onClick={submit}>
          {cancelling ? 'Cancel order' : 'Submit request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default OrderRequestDialog;

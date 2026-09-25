import React, { memo, useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Rating, TextField, Typography } from '@mui/material';
import { reviewService } from '../../services/reviewService';
import { apiErrorMessage } from '../../services/adminService';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface Props {
  target: { orderId: string; productId: string; productName: string; imageUrl: string } | null;
  onClose: () => void;
  onSubmitted: (rating: number) => void;
}

const ReviewDialog = memo(({ target, onClose, onSubmitted }: Props) => {
  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setRating(null); setTitle(''); setComment(''); setError(null); }, [target]);
  if (!target) return null;

  const submit = async () => {
    if (!rating) { setError('Choose a star rating'); return; }
    setSaving(true);
    setError(null);
    try {
      await reviewService.create({ productId: target.productId, orderId: target.orderId, rating, title: title.trim(), comment: comment.trim() });
      onSubmitted(rating);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit your review'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rate your purchase</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Box component="img" src={target.imageUrl} alt="" sx={{ width: 56, height: 70, objectFit: 'cover', background: '#f1eee9', mixBlendMode: 'multiply' }} />
          <Typography sx={{ fontWeight: 500 }}>{target.productName}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" sx={{ color: '#a8770f' }} />
          <Typography color="text.secondary">{rating ? LABELS[rating] : 'Tap to rate'}</Typography>
        </Box>
        <TextField fullWidth size="small" label="Headline (optional)" value={title} onChange={e => setTitle(e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} sx={{ mb: 2 }} />
        <TextField fullWidth multiline minRows={3} label="Tell other customers about fit and quality (optional)" value={comment}
          onChange={e => setComment(e.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} helperText={`${comment.length}/2000`} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Shown publicly with your first name and last initial.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit review'}</Button>
      </DialogActions>
    </Dialog>
  );
});

export default ReviewDialog;

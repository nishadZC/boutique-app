import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationService, RecommendationResult } from '../services/skinToneService';
import { MAX_IMAGE_SIZE_MB } from '../constants/config';

type StepId = 'choose' | 'preview' | 'analyzing' | 'results';

export function useSkinTone() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState<StepId>('choose');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<RecommendationResult | null>(null);
  const [outfitTab, setOutfitTab] = useState<'outfits' | 'individual'>('outfits');

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const reset = useCallback(() => {
    setStep('choose'); setImageFile(null); setPreviewUrl(null);
    setError(null); setResult(null); setOutfitTab('outfits');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => { reset(); navigate('/products'); }, [reset, navigate]);

  const handleChoosePhoto = useCallback(() => { setError(null); fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { setError(`Image must be under ${MAX_IMAGE_SIZE_MB}MB.`); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
    setError(null);
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setStep('analyzing');
    setError(null);
    try {
      const data = await recommendationService.analyze(imageFile);
      setResult(data);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setStep('preview');
    }
  }, [imageFile]);

  return {
    step, imageFile, previewUrl, error, result, outfitTab, fileInputRef,
    setOutfitTab, reset, handleClose, handleChoosePhoto, handleFileChange, handleAnalyze,
  };
}
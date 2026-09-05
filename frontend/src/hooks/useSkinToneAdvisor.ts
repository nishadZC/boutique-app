import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationService, RecommendationResult } from 'services/skinToneService';

export type StepId = 'choose' | 'preview' | 'analyzing' | 'results';

export const useSkinToneAdvisor = () => {
  const [step, setStep] = useState<StepId>('choose');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [outfitTab, setOutfitTab] = useState<'outfits' | 'individual'>('outfits');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const resetState = () => {
    setStep('choose');
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setOutfitTab('outfits');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    navigate('/products');
  };

  const handleChoosePhoto = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 20MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setPreviewUrl(newPreviewUrl);
    setError(null);
    setStep('preview');
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('Please select a photo first.');
      setStep('choose');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const data = await recommendationService.analyze(imageFile);
      setResult(data);
      setStep('results');
    } catch (err: any) {
      let errorMessage = err?.message || 'Analysis failed. Please try again with a clearer face photo.';
      if (errorMessage.toLowerCase().includes('face')) {
        errorMessage = 'Face not detected. Please try a clearer photo.';
      }
      setError(errorMessage);
      setStep('preview');
    }
  };

  const handleRetry = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setStep('choose');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    step,
    imageFile,
    previewUrl,
    error,
    result,
    outfitTab,
    setOutfitTab,
    fileInputRef,
    navigate,
    handleClose,
    handleChoosePhoto,
    handleFileChange,
    handleAnalyze,
    handleRetry
  };
};

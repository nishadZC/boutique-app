import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RecommendationResult } from '../services/skinToneService';

export type StepId = 'choose' | 'preview' | 'analyzing' | 'results';

interface SkinToneAdvisorState {
  step: StepId;
  setStep: (step: StepId) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  result: RecommendationResult | null;
  setResult: (result: RecommendationResult | null) => void;
  outfitTab: 'outfits' | 'individual';
  setOutfitTab: (tab: 'outfits' | 'individual') => void;
}

const SkinToneAdvisorContext = createContext<SkinToneAdvisorState | undefined>(undefined);

// Mounted once at the router root (see Providers.tsx) so the upload, analysis
// result and step survive navigating to a product's detail page and back.
export const SkinToneAdvisorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<StepId>('choose');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [outfitTab, setOutfitTab] = useState<'outfits' | 'individual'>('outfits');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <SkinToneAdvisorContext.Provider value={{
      step, setStep,
      imageFile, setImageFile,
      previewUrl, setPreviewUrl,
      error, setError,
      result, setResult,
      outfitTab, setOutfitTab,
    }}>
      {children}
    </SkinToneAdvisorContext.Provider>
  );
};

export const useSkinToneAdvisorState = (): SkinToneAdvisorState => {
  const context = useContext(SkinToneAdvisorContext);
  if (context === undefined) {
    throw new Error('useSkinToneAdvisorState must be used within a SkinToneAdvisorProvider');
  }
  return context;
};

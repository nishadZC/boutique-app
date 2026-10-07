import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSkinToneAdvisor } from './useSkinToneAdvisor';
import { recommendationService } from 'services/skinToneService';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('services/skinToneService', () => ({ recommendationService: { analyze: vi.fn() } }));
vi.mock('contexts/SkinToneAdvisorContext', async () => {
  const { useState: us } = await import('react');
  return {
    useSkinToneAdvisorState: () => {
      const [step, setStep] = us('choose');
      const [imageFile, setImageFile] = us<any>(null);
      const [previewUrl, setPreviewUrl] = us<any>(null);
      const [error, setError] = us<any>(null);
      const [result, setResult] = us<any>(null);
      const [outfitTab, setOutfitTab] = us('outfits');
      return { step, setStep, imageFile, setImageFile, previewUrl, setPreviewUrl, error, setError, result, setResult, outfitTab, setOutfitTab };
    },
  };
});
void useState;

const img = new File(['x'], 'a.png', { type: 'image/png' });
const ev = (file?: any) => ({ target: { files: file ? [file] : [] } } as any);

describe('useSkinToneAdvisor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:1');
    URL.revokeObjectURL = vi.fn();
  });

  const setup = () => {
    const r = renderHook(() => useSkinToneAdvisor());
    const input = document.createElement('input');
    input.click = vi.fn();
    (r.result.current.fileInputRef as any).current = input;
    return { ...r, input };
  };

  it('validates files', () => {
    const { result } = setup();
    act(() => result.current.handleFileChange(ev()));
    expect(result.current.step).toBe('choose');
    act(() => result.current.handleFileChange(ev(new File(['x'], 'a.txt', { type: 'text/plain' }))));
    expect(result.current.error).toMatch(/valid image/);
    const big = new File(['x'], 'b.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 });
    act(() => result.current.handleFileChange(ev(big)));
    expect(result.current.error).toMatch(/20MB/);
  });

  it('previews, replaces preview, analyzes, retries', async () => {
    const { result, input } = setup();
    act(() => result.current.handleChoosePhoto());
    expect(input.click).toHaveBeenCalled();
    act(() => result.current.handleFileChange(ev(img)));
    expect(result.current.step).toBe('preview');
    act(() => result.current.handleFileChange(ev(img)));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    vi.mocked(recommendationService.analyze).mockResolvedValue({ ok: 1 } as any);
    await act(() => result.current.handleAnalyze());
    expect(result.current.step).toBe('results');
    expect(result.current.result).toEqual({ ok: 1 });
    act(() => result.current.handleRetry());
    expect(result.current.step).toBe('choose');
    expect(result.current.imageFile).toBeNull();
    act(() => result.current.handleRetry());
  });

  it('handles analysis errors', async () => {
    const { result } = setup();
    await act(() => result.current.handleAnalyze());
    expect(result.current.error).toBe('Please select a photo first.');
    act(() => result.current.handleFileChange(ev(img)));
    vi.mocked(recommendationService.analyze).mockRejectedValueOnce(new Error('No FACE found'));
    await act(() => result.current.handleAnalyze());
    expect(result.current.error).toBe('Face not detected. Please try a clearer photo.');
    expect(result.current.step).toBe('preview');
    vi.mocked(recommendationService.analyze).mockRejectedValueOnce(new Error('server down'));
    await act(() => result.current.handleAnalyze());
    expect(result.current.error).toBe('server down');
    vi.mocked(recommendationService.analyze).mockRejectedValueOnce({});
    await act(() => result.current.handleAnalyze());
    expect(result.current.error).toBe('Face not detected. Please try a clearer photo.');
  });

  it('closes and resets', () => {
    const { result } = setup();
    act(() => result.current.setOutfitTab('x' as any));
    act(() => result.current.handleClose());
    expect(result.current.outfitTab).toBe('outfits');
    expect(navigate).toHaveBeenCalledWith('/products');
  });

  it('resets without input ref', () => {
    const { result } = renderHook(() => useSkinToneAdvisor());
    act(() => { result.current.handleClose(); result.current.handleRetry(); result.current.handleChoosePhoto(); });
    expect(result.current.step).toBe('choose');
  });
});

export type MeasurementField = 'shoulder' | 'chest' | 'sleeve' | 'neck';

export const MEASUREMENT_LIMITS: Record<MeasurementField, { min: number; max: number }> = {
  shoulder: { min: 20, max: 70 },
  chest: { min: 50, max: 180 },
  sleeve: { min: 20, max: 100 },
  neck: { min: 20, max: 70 },
};

export const isValidMeasurement = (field: MeasurementField, value: string): boolean => {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return false;
  const numericValue = Number(value);
  const { min, max } = MEASUREMENT_LIMITS[field];
  return numericValue >= min && numericValue <= max;
};

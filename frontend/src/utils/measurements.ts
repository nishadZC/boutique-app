import type { GarmentType } from './productSizing';

export type MeasurementField = 'shoulder' | 'chest' | 'sleeve' | 'neck' | 'length';

export const MEASUREMENT_LIMITS: Record<MeasurementField, { min: number; max: number }> = {
  shoulder: { min: 20, max: 70 },
  chest: { min: 50, max: 180 },
  sleeve: { min: 20, max: 100 },
  neck: { min: 20, max: 70 },
  // Garment length from the base of the collar: a waistcoat to a full-length coat.
  length: { min: 40, max: 130 },
};

export const MEASUREMENT_LABELS: Record<MeasurementField, string> = {
  shoulder: 'Shoulder',
  chest: 'Chest',
  sleeve: 'Sleeve',
  neck: 'Neck',
  length: 'Length',
};

/** The measurements the atelier needs to tailor each kind of garment. */
const TAILORING_FIELDS: Partial<Record<GarmentType, MeasurementField[]>> = {
  shirt: ['shoulder', 'chest', 'sleeve', 'neck'],
  blazer: ['chest', 'shoulder', 'sleeve', 'length'],
  suit: ['chest', 'shoulder', 'sleeve', 'length'],
  coat: ['chest', 'shoulder', 'sleeve', 'length'],
  waistcoat: ['chest', 'shoulder', 'length'],
};

const EXAMPLES: Partial<Record<GarmentType, Partial<Record<MeasurementField, number>>>> = {
  shirt: { shoulder: 45, chest: 100, sleeve: 64, neck: 40 },
  blazer: { chest: 102, shoulder: 46, sleeve: 64, length: 76 },
  suit: { chest: 102, shoulder: 46, sleeve: 64, length: 76 },
  coat: { chest: 108, shoulder: 47, sleeve: 66, length: 105 },
  waistcoat: { chest: 100, shoulder: 40, length: 62 },
};

export const getTailoringFields = (garment: GarmentType | null): MeasurementField[] =>
  (garment && TAILORING_FIELDS[garment]) || [];

export const measurementExample = (garment: GarmentType | null, field: MeasurementField): string => {
  const example = garment ? EXAMPLES[garment]?.[field] : undefined;
  return example ? `e.g. ${example}` : '';
};

export const isValidMeasurement = (field: MeasurementField, value: string): boolean => {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return false;
  const numericValue = Number(value);
  const { min, max } = MEASUREMENT_LIMITS[field];
  return numericValue >= min && numericValue <= max;
};

/** The size recorded on the order line for a custom-tailored item. */
export const formatCustomSize = (
  fields: MeasurementField[],
  values: Partial<Record<MeasurementField, string>>,
  madeToMeasure = false,
): string => {
  const parts = fields.map(field => `${MEASUREMENT_LABELS[field]}: ${values[field]}cm`).join(', ');
  return `${madeToMeasure ? 'Made to measure' : 'Custom'} (${parts})`;
};

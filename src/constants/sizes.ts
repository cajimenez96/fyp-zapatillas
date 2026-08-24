import { GenderType } from '@/models/Product';

export const DEFAULT_GENDER_SIZES: Record<GenderType, number[]> = {
  Hombre: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
  Mujer: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  Niño: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  Unisex: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
};

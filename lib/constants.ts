import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);



export const DUMMY_PASSWORD = generateDummyPassword();

export const competencyColors = {
  A: '#ef4444', // Red-500 for Knowledge and Understanding
  B: '#3b82f6', // Blue-500 for Design and Development
  C: '#22c55e', // Green-500 for Responsibility and Management
  D: '#f97316', // Orange-500 for Communication and Interpersonal Skills
  E: '#a855f7', // Purple-500 for Professional Commitment
} as const;

export const competencyLabels = {
  A: 'Knowledge & Understanding',
  B: 'Design & Development',
  C: 'Responsibility & Management',
  D: 'Communication & Interpersonal',
  E: 'Professional Commitment',
} as const;

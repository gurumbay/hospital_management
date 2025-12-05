export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 1024;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'Minimal 8 karakter';
  if (password.length > MAX_PASSWORD_LENGTH) return 'Maksimal 1024 karakter';
  if (!/[A-Z]/.test(password)) return 'Harus ada huruf besar';
  if (!/[a-z]/.test(password)) return 'Harus ada huruf kecil';
  if (!/[0-9]/.test(password)) return 'Harus ada angka';
  return null;
}

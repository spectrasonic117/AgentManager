export const validators = {
  username: (value: string): string | null => {
    if (!value.trim()) return 'El usuario es obligatorio';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 20) return 'Máximo 20 caracteres';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Solo letras, números y guiones bajos';
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value.trim()) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Correo inválido';
    return null;
  },

  password: (value: string): string | null => {
    if (!value) return 'La contraseña es obligatoria';
    if (value.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Debe tener una mayúscula';
    if (!/[0-9]/.test(value)) return 'Debe tener un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Debe tener un carácter especial';
    }
    return null;
  },

  confirmPassword: (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  },

  getPasswordStrength: (password: string): { score: number; label: string; color: string } => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

    const levels = [
      { score: 0, label: 'Muy débil', color: 'bg-red-500' },
      { score: 1, label: 'Débil', color: 'bg-orange-500' },
      { score: 2, label: 'Regular', color: 'bg-yellow-500' },
      { score: 3, label: 'Buena', color: 'bg-blue-500' },
      { score: 4, label: 'Fuerte', color: 'bg-cyan-500' },
      { score: 5, label: 'Muy fuerte', color: 'bg-green-500' },
    ];

    return levels[Math.min(score, 5)];
  },
};

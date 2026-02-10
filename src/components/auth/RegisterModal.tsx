import { useState, useEffect } from 'react';
import { X, User, Mail, ArrowRight, AlertCircle, Check, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validators } from '../../utils/validators';
import { PasswordInput } from './PasswordInput';

interface RegisterModalProps {
  onClose: () => void;
}

export function RegisterModal({ onClose }: RegisterModalProps) {
  const { register, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const passwordStrength = validators.getPasswordStrength(password);

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.username) {
      const usernameError = validators.username(username);
      if (usernameError) newErrors.username = usernameError;
    }

    if (touched.email && email) {
      const emailError = validators.email(email);
      if (emailError) newErrors.email = emailError;
    }

    if (touched.password) {
      const passwordError = validators.password(password);
      if (passwordError) newErrors.password = passwordError;
    }

    if (touched.confirmPassword && confirmPassword) {
      const confirmError = validators.confirmPassword(password, confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    setErrors(newErrors);

    const isValid =
      validators.username(username) === null &&
      validators.email(email || '') === null &&
      validators.password(password) === null &&
      validators.confirmPassword(password, confirmPassword) === null;

    setIsFormValid(isValid);
  }, [username, email, password, confirmPassword, touched]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      return;
    }

    await register({ username, password, email: email || undefined });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md p-8 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4 shadow-lg shadow-green-500/20">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Crear Cuenta
          </h2>
          <p className="text-slate-400 text-sm">
            Completa los campos para registrarte
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) clearError();
                }}
                onBlur={() => handleBlur('username')}
                placeholder="tu_usuario"
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                  touched.username && errors.username
                    ? 'border-red-500/50'
                    : touched.username && !errors.username && username
                    ? 'border-green-500/50'
                    : 'border-white/10'
                }`}
              />
              {touched.username && !errors.username && username && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
              )}
            </div>
            {touched.username && errors.username && (
              <p className="mt-1 text-xs text-red-400">{errors.username}</p>
            )}
            {touched.username && !errors.username && username && (
              <p className="mt-1 text-xs text-green-400">Usuario válido</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email <span className="text-slate-500">(opcional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                onBlur={() => handleBlur('email')}
                placeholder="correo@ejemplo.com"
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                  touched.email && errors.email
                    ? 'border-red-500/50'
                    : touched.email && !errors.email && email
                    ? 'border-green-500/50'
                    : 'border-white/10'
                }`}
              />
              {touched.email && !errors.email && email && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
              )}
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <PasswordInput
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) clearError();
              }}
              placeholder="••••••••"
              name="password"
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score + 1) * 16.66}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 min-w-[60px]">{passwordStrength.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-2.5 h-2.5 ${password.length >= 8 ? 'opacity-100' : 'opacity-40'}`} />
                    8+ caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-2.5 h-2.5 ${/[A-Z]/.test(password) ? 'opacity-100' : 'opacity-40'}`} />
                    Mayúscula
                  </div>
                  <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-2.5 h-2.5 ${/[0-9]/.test(password) ? 'opacity-100' : 'opacity-40'}`} />
                    Número
                  </div>
                  <div className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-2.5 h-2.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'opacity-100' : 'opacity-40'}`} />
                    Símbolo
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <PasswordInput
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  if (error) clearError();
                }}
                placeholder="••••••••"
                name="confirmPassword"
              />
              {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
                <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
              )}
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
            {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
              <p className="mt-1 text-xs text-green-400">Las contraseñas coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!isFormValid && Object.keys(touched).length > 0)}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando...
              </span>
            ) : (
              <>
                Crear Cuenta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onClose}
                className="text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

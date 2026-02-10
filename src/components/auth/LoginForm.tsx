import { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validators } from '../../utils/validators';
import { PasswordInput } from './PasswordInput';
import { RegisterModal } from './RegisterModal';

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [touched, setTouched] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const error = validators.username(username);
    setUsernameError(error || '');
    setIsFormValid(username.length > 0 && password.length > 0 && !error);
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    clearError();

    const validationError = validators.username(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    await login({ username, password, rememberMe });
  };

  const handleUsernameBlur = () => {
    setTouched(true);
    const error = validators.username(username);
    setUsernameError(error || '');
  };

  return (
    <>
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Acceso Restringido
          </h2>
          <p className="text-slate-400 text-sm">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) clearError();
                }}
                onBlur={handleUsernameBlur}
                placeholder="tu_usuario"
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border ${
                  touched && usernameError
                    ? 'border-red-500/50'
                    : touched && !usernameError && username
                    ? 'border-green-500/50'
                    : 'border-white/10'
                } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300`}
              />
              {touched && !usernameError && username && (
                <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
            </div>
            {touched && usernameError && (
              <p className="mt-2 text-sm text-red-400">{usernameError}</p>
            )}
          </div>

          <PasswordInput
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (error) clearError();
            }}
            placeholder="••••••••"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="text-sm text-slate-400 cursor-pointer select-none"
            >
              Recordar sesión
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!isFormValid && touched)}
            className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/25'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verificando...
              </span>
            ) : (
              <>
                Entrar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-400">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                Crear cuenta
                <UserPlus className="w-4 h-4" />
              </button>
            </p>
          </div>
        </form>
      </div>

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

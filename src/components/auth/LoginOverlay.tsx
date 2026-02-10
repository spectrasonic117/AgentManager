import { LoginForm } from './LoginForm';

interface LoginOverlayProps {
  children: React.ReactNode;
}

export function LoginOverlay({ children }: LoginOverlayProps) {
  return (
    <div className="relative min-h-screen">
      {children}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl">
        <LoginForm />
      </div>
    </div>
  );
}

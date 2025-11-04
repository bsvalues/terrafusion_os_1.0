import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X  } from '@mui/icons-material';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onSubmit?: (email: string, password: string) => void;
}

export function AuthModal({ isOpen, onClose, title = 'Sign In', onSubmit }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/64 flex items-center justify-center p-4 z-50">
      <div
        className="relative w-full max-w-md p-8 bg-tf-dark-blue border border-tf-primary/20 rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.1)',
        }}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-tf-primary opacity-10 blur-[80px] -z-10" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-tf-primary/60 hover:text-tf-primary transition-colors"
        >
<>
          <X size={18} />
        </button>

        <div
</> className="mb-6 text-center">
<>
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p
</> className="text-tf-primary/60 text-sm">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="space-y-2">
<>
              <Label htmlFor="email" className="text-tf-primary/80 block text-sm">
                Email
              </Label>
              <Input
</>
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-tf-dark-blue bg-opacity-70 border border-tf-primary/30 text-white rounded-lg 
                  focus:border-tf-primary focus:ring-1 focus:ring-tf-primary focus:outline-none 
                  px-4 py-3 placeholder-gray-400"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
<>
                <Label htmlFor="password" className="text-tf-primary/80 block text-sm">
                  Password
                </Label>
                <a
</>
                  href="#"
                  className="text-sm text-tf-primary/70 hover:text-tf-primary transition-colors"
                >
                  Forgot password?
                </a>
              </div>
<>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-tf-dark-blue bg-opacity-70 border border-tf-primary/30 text-white rounded-lg 
                  focus:border-tf-primary focus:ring-1 focus:ring-tf-primary focus:outline-none 
                  px-4 py-3 placeholder-gray-400"
                placeholder="Enter your password"
              />
            </div>

            <Button
</>
              type="submit"
              className="w-full h-12 bg-tf-primary hover:bg-tf-secondary text-tf-dark-blue transition-colors 
                font-medium rounded-lg flex items-center justify-center"
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-tf-primary/60 text-sm">
            Don't have an account?{' '}
            <a href="#" className="text-tf-primary hover:text-tf-primary/80 transition-colors">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function OperatorSessionButton() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout('operator-sign-out');
    setOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen((current) => !current)}
        className='flex items-center opacity-40 hover:opacity-80 transition-opacity'
        aria-label='Profile'
        title='Profile'
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <User className='h-3.5 w-3.5' />
      </button>

      {open && (
        <div
          role='menu'
          aria-label='Operator session'
          className='absolute right-0 top-6 min-w-32 rounded-md border border-[hsl(var(--tf-border)_/_0.35)] bg-[hsl(var(--tf-surface))] p-1 shadow-lg'
        >
          <button
            type='button'
            role='menuitem'
            onClick={handleSignOut}
            className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-[hsl(var(--tf-text))] hover:bg-[hsl(var(--tf-text)_/_0.07)]'
          >
            <LogOut className='h-3.5 w-3.5' />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

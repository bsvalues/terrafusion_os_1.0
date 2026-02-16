import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

/**
 * LoginPage — Auth redirect target.
 * When a 401 response triggers a redirect to /login, this page
 * provides a minimal sign-in surface instead of a blank page.
 *
 * Phase 18: Uses auth boundary. On submit, calls login() with a
 * placeholder token and navigates to /. Real JWT exchange will
 * be wired in a future phase.
 */
const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — real auth flow (JWT exchange) will be wired in a future phase
    login('TERRAFUSION_SESSION_TOKEN');
    navigate('/');
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'>
      <div className='w-full max-w-md p-8 rounded-2xl bg-gray-800/80 border border-cyan-500/30 shadow-lg'>
        <h1 className='text-2xl font-bold text-cyan-400 mb-2 text-center'>TerraFusion OS</h1>
        <p className='text-gray-400 text-sm text-center mb-6'>
          Your session has expired. Please sign in to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label className='block text-gray-300 text-sm mb-1' htmlFor='username'>
            Username
          </label>
          <input
            id='username'
            type='text'
            className='w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-cyan-500 focus:outline-none mb-4'
            autoFocus
          />
          <label className='block text-gray-300 text-sm mb-1' htmlFor='password'>
            Password
          </label>
          <input
            id='password'
            type='password'
            className='w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-cyan-500 focus:outline-none mb-6'
          />
          <button
            type='submit'
            className='w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors'
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

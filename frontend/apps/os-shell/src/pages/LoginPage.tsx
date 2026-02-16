import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { login as authLogin } from '@/services/authAPI';

/**
 * LoginPage — Auth redirect target with real JWT exchange.
 *
 * Phase 20: Calls the backend at /api/auth/login with { email, password }.
 * On success: stores token via useAuth().login(token) and navigates to /.
 * On failure: displays a deterministic error message.
 */
const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authLogin({ email, password });
      login(result.token);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'>
      <div className='w-full max-w-md p-8 rounded-2xl bg-gray-800/80 border border-cyan-500/30 shadow-lg'>
        <h1 className='text-2xl font-bold text-cyan-400 mb-2 text-center'>TerraFusion OS</h1>
        <p className='text-gray-400 text-sm text-center mb-6'>
          Your session has expired. Please sign in to continue.
        </p>
        {error && (
          <div className='mb-4 p-3 rounded bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center'>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className='block text-gray-300 text-sm mb-1' htmlFor='email'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-cyan-500 focus:outline-none mb-4'
            autoFocus
          />
          <label className='block text-gray-300 text-sm mb-1' htmlFor='password'>
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-cyan-500 focus:outline-none mb-6'
          />
          <button
            type='submit'
            disabled={loading}
            className='w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-semibold transition-colors'
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

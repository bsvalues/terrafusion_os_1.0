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
    <div
      className='min-h-screen overflow-hidden bg-[#070f1d] text-slate-100'
      data-testid='login-page'
    >
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(22,119,148,0.18),transparent_30%),linear-gradient(135deg,rgba(9,17,31,0.98),rgba(15,28,47,0.94)_52%,rgba(8,15,27,0.98))]' />
      <div className='absolute inset-x-0 top-0 h-px bg-cyan-300/25' />
      <div className='absolute left-10 top-10 hidden h-[calc(100vh-5rem)] w-px bg-cyan-100/10 lg:block' />
      <div className='absolute bottom-12 right-12 hidden h-48 w-48 rounded-full border border-cyan-200/10 lg:block' />

      <main className='relative flex min-h-screen items-center justify-center px-8 py-12 lg:px-16'>
        <div className='grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_430px]'>
        <section className='max-w-2xl'>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70'>
            TerraFusion OS
          </p>
          <h1 className='mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-slate-50 md:text-5xl'>
            Government Operations Access
          </h1>
          <p className='mt-5 max-w-xl text-base leading-7 text-slate-300'>
            Authorized operators enter the governed TerraFusion runtime with administrator-issued credentials.
          </p>

          <div className='mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2'>
            {[
              ['Runtime Authority', 'TerraFusion DB'],
              ['Identity Model', 'Provisioned operator'],
              ['Session Model', 'Audited JWT session'],
              ['Jurisdiction', 'Washington county operations'],
            ].map(([label, value]) => (
              <div key={label} className='rounded-lg border border-cyan-100/10 bg-slate-950/35 px-4 py-3'>
                <div className='text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                  {label}
                </div>
                <div className='mt-1 text-sm font-medium text-slate-200'>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className='w-full justify-self-center lg:max-w-md'>
          <div className='rounded-xl border border-cyan-200/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur'>
            <div className='mb-6'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80'>
                Controlled Access
              </p>
              <h2 className='mt-2 text-2xl font-semibold text-slate-50'>Operator Sign In</h2>
              <p className='mt-3 text-sm leading-6 text-slate-400'>
                Authorized operator access only. Credentials are provisioned through TerraFusion administration.
              </p>
            </div>

        {error && (
          <div className='mb-4 rounded-lg border border-red-400/40 bg-red-950/50 p-3 text-sm text-red-200'>
            {error}
          </div>
        )}
            <form onSubmit={handleSubmit}>
              <label className='block text-sm font-medium text-slate-300' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='mt-2 w-full rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2.5 text-slate-100 outline-none transition-colors focus:border-cyan-300'
                autoFocus
              />
              <label className='mt-4 block text-sm font-medium text-slate-300' htmlFor='password'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='mt-2 w-full rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2.5 text-slate-100 outline-none transition-colors focus:border-cyan-300'
              />
              <button
                type='submit'
                disabled={loading}
                className='mt-6 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-slate-300'
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
        </div>
      </main>
      </div>
  );
};

export default LoginPage;

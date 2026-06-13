import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { getAccessPolicy, login as authLogin, type AccessPolicy } from '@/services/authAPI';

const DEFAULT_ACCESS_MESSAGE =
  'Access is issued through TerraFusion administration for authorized Washington county operators. No public signup is available.';

const runtimePosture = [
  ['Runtime Authority', 'TerraFusion DB'],
  ['Identity Model', 'Provisioned Operator'],
  ['Session Model', 'Audited JWT Session'],
  ['Operational Scope', 'Washington County Program'],
  ['Governance Mode', 'Evidence-Gated Runtime'],
];

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
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy | null>(null);

  useEffect(() => {
    let active = true;

    getAccessPolicy().then((policy) => {
      if (active) setAccessPolicy(policy);
    });

    return () => {
      active = false;
    };
  }, []);

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
      className='min-h-screen overflow-hidden bg-slate-950 text-slate-100'
      data-testid='login-page'
    >
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(56,189,248,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.045)_1px,transparent_1px)] bg-[size:64px_64px]' />
      <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.6),rgba(15,23,42,0.18)_48%,rgba(2,6,23,0.85))]' />

      <main className='relative flex min-h-screen flex-col'>
        <header className='flex min-h-16 items-center justify-between border-b border-cyan-500/20 bg-slate-950/80 px-6 backdrop-blur md:px-10'>
          <div>
            <p className='text-sm font-semibold tracking-wide text-cyan-200'>TerraFusion OS</p>
            <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Government Operations Runtime</p>
          </div>
          <div className='hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-slate-400 md:flex'>
            <span>Washington County Operations</span>
            <span className='rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-200'>
              Controlled Production
            </span>
          </div>
        </header>

        <section className='grid flex-1 items-center gap-10 px-6 py-10 md:grid-cols-[minmax(0,1fr)_440px] md:px-10 lg:px-16'>
          <div className='max-w-4xl'>
            <p className='mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300'>
              Washington County Operations
            </p>
            <h1 className='max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl'>
              Government Operations Runtime
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-300'>
              Controlled production access for authorized county operators entering the governed TerraFusion operating environment.
            </p>

            <div className='mt-10 max-w-3xl border-y border-cyan-500/20 bg-slate-950/40'>
              {runtimePosture.map(([label, value]) => (
                <div
                  key={label}
                  className='grid grid-cols-[190px_minmax(0,1fr)] border-b border-cyan-500/10 py-4 last:border-b-0'
                >
                  <span className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>{label}</span>
                  <span className='text-sm font-medium text-slate-100'>{value}</span>
                </div>
              ))}
            </div>

            <p className='mt-8 max-w-2xl text-sm leading-7 text-slate-400'>
              The entry state is intentionally provisioned, role-scoped, and auditable. Operator access begins with identity,
              session, and runtime authority before work enters the county operating shell.
            </p>
          </div>

          <aside className='rounded-lg border border-cyan-500/25 bg-slate-950/85 p-7 shadow-2xl shadow-black/40 backdrop-blur'>
            <div className='mb-6 border-b border-cyan-500/20 pb-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-500'>
                Controlled Production Access
              </p>
              <h2 className='mt-2 text-2xl font-semibold text-cyan-200'>Operator Access</h2>
              <p className='mt-3 text-sm leading-6 text-slate-300'>
                Use administrator-issued operator credentials to enter TerraFusion OS.
              </p>
            </div>

            <div className='mb-5 rounded border border-cyan-500/20 bg-cyan-950/20 px-4 py-4 text-sm leading-6 text-slate-300'>
              <p className='font-semibold text-cyan-200'>Provisioned access only</p>
              <p className='mt-1'>{accessPolicy?.message ?? DEFAULT_ACCESS_MESSAGE}</p>
              <p className='mt-3 text-slate-400'>Public signup is disabled. Access is issued through TerraFusion administration.</p>
            </div>

            {error && (
              <div className='mb-4 rounded border border-red-500/50 bg-red-950/50 p-3 text-sm text-red-200'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='mb-4 w-full rounded border border-slate-600 bg-slate-800 px-3 py-3 text-slate-100 outline-none transition-colors focus:border-cyan-400'
                autoFocus
              />
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='password'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='mb-6 w-full rounded border border-slate-600 bg-slate-800 px-3 py-3 text-slate-100 outline-none transition-colors focus:border-cyan-400'
              />
              <button
                type='submit'
                disabled={loading}
                className='w-full rounded bg-cyan-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-900 disabled:text-slate-400'
              >
                {loading ? 'Entering TerraFusion OS...' : 'Enter TerraFusion OS'}
              </button>
            </form>
          </aside>
        </section>

        <footer className='relative border-t border-cyan-500/20 bg-slate-950/80 px-6 py-4 text-xs text-slate-500 md:px-10'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <span>Provisioned operator access only. No public signup.</span>
            <span>All sessions are governed, auditable, and role-scoped.</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;

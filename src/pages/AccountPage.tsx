import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Mode = 'login' | 'register' | 'reset';

export default function AccountPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user?.email || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(''); setError(''); setBusy(true);
    try {
      if (!supabase) throw new Error('Add the Supabase URL and publishable key to .env.local first.');
      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (authError) throw authError;
        setMessage(data.session ? 'Your account is ready.' : 'Check your email to confirm your account, then sign in.');
        setMode('login');
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account` });
        if (authError) throw authError;
        setMessage('If an account exists for that address, a password reset link is on its way.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setMessage('You are signed in.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally { setBusy(false); }
  }

  async function signInWithGoogle() {
    setMessage(''); setError(''); setGoogleBusy(true);
    try {
      if (!supabase) throw new Error('Google sign-in is unavailable until Supabase is connected.');
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in could not be started.');
      setGoogleBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage('You are signed out.');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Breadcrumbs items={[{ label: 'Account' }]} />
      <div className="mx-auto mt-8 max-w-md">
        <h1 className="font-serif text-3xl font-light text-ink">Your account</h1>
        {!isSupabaseConfigured && <p className="mt-3 bg-amber-50 p-3 text-sm text-amber-900">Supabase is not connected yet. Add the project URL and publishable key in <code>.env.local</code>.</p>}
        {userEmail ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-ink-soft">Signed in as {userEmail}</p>
            <Link className="text-sm underline" to="/orders">Order history</Link>
            <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
            <div className="flex gap-3 border-b border-ink/10 pb-3 text-sm">
              <button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'font-semibold' : 'text-ink-soft'}>Sign in</button>
              <button type="button" onClick={() => setMode('register')} className={mode === 'register' ? 'font-semibold' : 'text-ink-soft'}>Create account</button>
            </div>
            {mode === 'register' && <label className="block text-sm">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-ink/15 bg-transparent px-3 py-2.5" autoComplete="name" /></label>}
            {mode !== 'reset' && <>
              <Button type="button" variant="outline" disabled={busy || googleBusy || !isSupabaseConfigured} onClick={() => void signInWithGoogle()} className="w-full">
                <GoogleMark />
                {googleBusy ? 'Connecting to Google…' : 'Continue with Google'}
              </Button>
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-ink-light" aria-hidden="true">
                <span className="h-px flex-1 bg-ink/10" />
                <span>or use email</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>
            </>}
            <label className="block text-sm">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-ink/15 bg-transparent px-3 py-2.5" autoComplete="email" /></label>
            {mode !== 'reset' && <label className="block text-sm">Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-ink/15 bg-transparent px-3 py-2.5" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>}
            {mode === 'login' && <button type="button" onClick={() => setMode('reset')} className="text-xs text-ink-soft underline">Forgot password?</button>}
            {mode === 'reset' && <button type="button" onClick={() => setMode('login')} className="text-xs text-ink-soft underline">Back to sign in</button>}
            {message && <p role="status" className="text-sm text-green-800">{message}</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={busy || googleBusy || !isSupabaseConfigured}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.47-4.75 7.16l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55Z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.82l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>;
}

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
            <label className="block text-sm">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-ink/15 bg-transparent px-3 py-2.5" autoComplete="email" /></label>
            {mode !== 'reset' && <label className="block text-sm">Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-ink/15 bg-transparent px-3 py-2.5" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>}
            {mode === 'login' && <button type="button" onClick={() => setMode('reset')} className="text-xs text-ink-soft underline">Forgot password?</button>}
            {mode === 'reset' && <button type="button" onClick={() => setMode('login')} className="text-xs text-ink-soft underline">Back to sign in</button>}
            {message && <p role="status" className="text-sm text-green-800">{message}</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={busy || !isSupabaseConfigured}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

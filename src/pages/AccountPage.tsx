import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, LogOut, Sparkles, User as UserIcon } from 'lucide-react';
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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setUserEmail(session?.user?.email || null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);
    try {
      if (!supabase) throw new Error('Add the Supabase URL and publishable key to .env.local first.');
      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (authError) throw authError;
        setMessage(data.session ? 'Your account has been created.' : 'Check your email to confirm your account, then sign in.');
        setMode('login');
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account`,
        });
        if (authError) throw authError;
        setMessage('If an account exists for that address, a password reset link has been dispatched.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setMessage('Welcome back. You are securely signed in.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setMessage('');
    setError('');
    setGoogleBusy(true);
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
    setMessage('You have signed out.');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-[75vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Account' }]} />

      <div className="mx-auto mt-8 max-w-md">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center justify-center gap-1.5">
            <Sparkles size={13} />
            VJ Collection Privileges
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-charcoal">
            {userEmail ? 'Account Dashboard' : 'Client Access'}
          </h1>
          <p className="mt-2 text-xs text-charcoal-soft">
            {userEmail
              ? 'Manage your orders, saved delivery addresses, and personal curations.'
              : 'Sign in to access your saved addresses, track shipments, and view order history.'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200">
            Database connection pending. Add your Supabase project keys in <code>.env.local</code>.
          </p>
        )}

        {userEmail ? (
          <div className="rounded-3xl bg-white border border-charcoal/10 p-7 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-charcoal/8">
              <div className="h-12 w-12 rounded-2xl bg-ivory flex items-center justify-center text-charcoal">
                <UserIcon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light">Signed in as</p>
                <p className="font-serif text-base font-medium text-charcoal">{userEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/orders"
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-charcoal/10 bg-ivory/60 hover:bg-white hover:border-charcoal/25 transition-all text-center gap-2"
              >
                <Package size={20} className="text-charcoal" />
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">Order History</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-charcoal/10 bg-ivory/60 hover:bg-white hover:border-charcoal/25 transition-all text-center gap-2"
              >
                <Heart size={20} className="text-charcoal" />
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">Saved Wishlist</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-charcoal/8 flex justify-between items-center">
              <Link to="/shop" className="text-xs font-semibold uppercase tracking-wider text-clay hover:underline">
                Explore Shop
              </Link>
              <button
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal-light hover:text-charcoal"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-charcoal/10 p-7 sm:p-8 shadow-xs">
            {/* Mode Switcher Tabs */}
            <div className="flex gap-2 p-1 rounded-xl bg-ivory border border-charcoal/8 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-charcoal text-ivory shadow-xs'
                    : 'text-charcoal-soft hover:text-charcoal'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-charcoal text-ivory shadow-xs'
                    : 'text-charcoal-soft hover:text-charcoal'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              {mode !== 'reset' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || googleBusy || !isSupabaseConfigured}
                    onClick={() => void signInWithGoogle()}
                    className="w-full rounded-xl py-2.5"
                  >
                    <GoogleMark />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {googleBusy ? 'Connecting to Google…' : 'Continue with Google'}
                    </span>
                  </Button>

                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-charcoal-light my-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-charcoal/10" />
                    <span>or continue with email</span>
                    <span className="h-px flex-1 bg-charcoal/10" />
                  </div>
                </>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/40 text-charcoal focus:outline-charcoal"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/40 text-charcoal focus:outline-charcoal"
                  autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[11px] text-clay hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/40 text-charcoal focus:outline-charcoal"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                </div>
              )}

              {mode === 'reset' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-clay hover:underline"
                  >
                    Remembered password? Back to sign in
                  </button>
                </div>
              )}

              {message && (
                <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                  {message}
                </p>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-xl py-3 text-xs font-semibold uppercase tracking-wider mt-2"
                disabled={busy || googleBusy || !isSupabaseConfigured}
              >
                {busy
                  ? 'Verifying…'
                  : mode === 'register'
                    ? 'Create VJ Account'
                    : mode === 'reset'
                      ? 'Dispatch Reset Link'
                      : 'Sign In to Account'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.47-4.75 7.16l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.82l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

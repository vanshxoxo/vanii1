import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  Package,
  Heart,
  LogOut,
  Sparkles,
  User as UserIcon,
  Bell,
  MapPin,
  Shield,
  Plus,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Phone,
  Calendar,
} from 'lucide-react';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatINR } from '../data';

interface CustomerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at?: string;
}

interface SavedAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  placed_at: string;
  payment_method: string;
}

interface CustomerNotificationItem {
  id: string;
  title: string;
  message: string;
  channel: string;
  delivery_status: string;
  created_at: string;
}

type Mode = 'login' | 'register' | 'reset';
type DashboardTab = 'overview' | 'orders' | 'addresses' | 'profile' | 'security';

export default function AccountPage() {
  const navigate = useNavigate();

  // Auth & Session state
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  // Auth Form states
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Dashboard Data states
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Address Modal / Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Profile Edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Change state
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // Clean trailing hash if present (e.g. /account#)
  useEffect(() => {
    if (window.location.hash === '#' || window.location.hash.startsWith('#access_token=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Safe Profile Loader & Initializer
  const loadCustomerData = useCallback(async (authUser: User) => {
    if (!supabase || !authUser) return;
    setIsLoadingDashboard(true);
    setDashboardError(null);

    try {
      // 1. Fetch or create Customer Profile
      let custProfile: CustomerProfile = {
        id: authUser.id,
        email: authUser.email || null,
        full_name: authUser.user_metadata?.full_name || null,
        phone: authUser.phone || null,
        created_at: authUser.created_at,
      };

      try {
        const { data: custData, error: custErr } = await supabase
          .from('customers')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!custErr && custData) {
          custProfile = {
            id: custData.id,
            email: custData.email || authUser.email,
            full_name: custData.full_name || authUser.user_metadata?.full_name,
            phone: custData.phone || authUser.phone,
            created_at: custData.created_at || authUser.created_at,
          };
        } else if (!custData) {
          // Attempt graceful profile upsert if allowed
          await supabase.from('customers').upsert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || null,
          });
        }
      } catch (e) {
        console.warn('Customer profile lookup fallback to auth metadata:', e);
      }

      setProfile(custProfile);
      setEditName(custProfile.full_name || '');
      setEditPhone(custProfile.phone || '');

      // 2. Fetch Customer Orders
      try {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('id,order_number,total,status,placed_at,payment_method')
          .eq('customer_id', authUser.id)
          .order('placed_at', { ascending: false })
          .limit(10);

        if (!orderErr && orderData) {
          setOrders(orderData);
        }
      } catch (e) {
        console.warn('Orders lookup handled:', e);
      }

      // 3. Fetch Saved Addresses
      try {
        const { data: addrData, error: addrErr } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', authUser.id)
          .order('is_default', { ascending: false });

        if (!addrErr && addrData) {
          setAddresses(addrData);
        }
      } catch (e) {
        console.warn('Addresses lookup handled:', e);
      }

      // 4. Fetch Customer Notifications (fail-safe)
      try {
        const { data: notifData } = await supabase
          .from('customer_notifications')
          .select('*')
          .eq('customer_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notifData) {
          setNotifications(notifData);
        }
      } catch {
        // Table might be pending migration; silently ignore
      }
    } catch (err: unknown) {
      console.error('Account data error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to load all account curations.';
      setDashboardError(msg);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  // Initial Auth Check & Listener
  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;

    // Check active session
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        void loadCustomerData(currentUser);
      }
      setIsInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        void loadCustomerData(currentUser);
      } else {
        setProfile(null);
        setOrders([]);
        setAddresses([]);
        setNotifications([]);
      }
      setIsInitializing(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCustomerData]);

  // Form Submit: Login / Register / Reset
  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);

    try {
      if (!supabase) throw new Error('Database connection is not configured.');

      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;
        setMessage(
          data.session
            ? 'Account created successfully! Welcome to VJ Collection.'
            : 'Check your email inbox to confirm your account credentials, then sign in.'
        );
        if (data.session) {
          setUser(data.session.user);
          void loadCustomerData(data.session.user);
        } else {
          setMode('login');
        }
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/account`,
        });
        if (authError) throw authError;
        setMessage('A password reset instruction link has been dispatched to your email.');
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setMessage('Welcome back. Signed in successfully.');
        if (data.user) {
          setUser(data.user);
          void loadCustomerData(data.user);
        }
      }
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : 'Authentication request failed.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  // Google OAuth
  async function signInWithGoogle() {
    setMessage('');
    setError('');
    setGoogleBusy(true);
    try {
      if (!supabase) throw new Error('Authentication gateway offline.');
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (authError) throw authError;
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : 'Google sign-in could not be initiated.';
      setError(msg);
      setGoogleBusy(false);
    }
  }

  // Sign Out
  async function signOut() {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate('/');
    } catch (e) {
      console.error('Sign out error:', e);
      setUser(null);
    }
  }

  // Update Profile
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setError('');

    try {
      // 1. Update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: editName.trim() },
      });

      // 2. Update customers table if present
      const { error: custErr } = await supabase.from('customers').upsert({
        id: user.id,
        email: user.email,
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        updated_at: new Date().toISOString(),
      });

      if (custErr) console.warn('Profile table sync note:', custErr.message);

      setProfile((prev) => ({
        id: user.id,
        email: user.email,
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        created_at: prev?.created_at,
      }));

      setProfileSuccessMsg('Personal profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile details.';
      setError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Save Address
  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsSavingAddress(true);
    setError('');

    try {
      const newAddr = {
        customer_id: user.id,
        label: addressLabel || 'Home',
        recipient_name: recipientName.trim(),
        phone: recipientPhone.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || '',
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country_code: 'IN',
        is_default: isDefaultAddress,
      };

      const { data, error: addrErr } = await supabase
        .from('customer_addresses')
        .insert(newAddr)
        .select()
        .single();

      if (addrErr) throw addrErr;

      if (data) {
        setAddresses((prev) => [data, ...prev]);
        setShowAddressForm(false);
        // reset form
        setRecipientName('');
        setRecipientPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setPostalCode('');
        setIsDefaultAddress(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save delivery address.';
      setError(msg);
    } finally {
      setIsSavingAddress(false);
    }
  }

  // Update Password
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !newPassword) return;
    setIsUpdatingPassword(true);
    setPasswordSuccessMsg('');
    setError('');

    try {
      const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
      if (pwdErr) throw pwdErr;
      setPasswordSuccessMsg('Your security password has been changed successfully.');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // Status badge styling
  const getOrderStatusBadge = (st: string) => {
    switch (st) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'processing':
      case 'shipped':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'pending_payment':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  // INITIAL LOADING SKELETON
  if (isInitializing) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 min-h-[75vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-clay/10 text-clay flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-serif text-lg text-charcoal">Restoring customer session…</p>
        <p className="text-xs text-charcoal-soft mt-1">VJ Collection Privileges</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-[75vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Account' }]} />

      {/* UNAUTHENTICATED STATE: LOGIN / REGISTER */}
      {!user ? (
        <div className="mx-auto mt-8 max-w-md">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center justify-center gap-1.5">
              <Sparkles size={13} />
              VJ Collection Privileges
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-charcoal">
              Client Access
            </h1>
            <p className="mt-2 text-xs text-charcoal-soft">
              Sign in to manage your orders, saved addresses, and personal curations.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200">
              Database connection pending. Please ensure your Supabase keys are configured.
            </p>
          )}

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

            <form onSubmit={submitAuth} className="space-y-4">
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

                  <div
                    className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-charcoal-light my-3"
                    aria-hidden="true"
                  >
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
                    placeholder="Enter your full name"
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
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900"
                >
                  {message}
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800"
                >
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
        </div>
      ) : (
        /* AUTHENTICATED STATE: RICH LUXURY DASHBOARD */
        <div className="mt-8 space-y-8 animate-fade-in">
          {/* HEADER WELCOME BANNER */}
          <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] flex items-center justify-center text-clay shrink-0">
                <UserIcon size={28} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay block">
                  Client Privileges
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal flex items-center gap-2">
                  <span>Welcome, {profile?.full_name || user.email?.split('@')[0]}</span>
                  {isLoadingDashboard && <RefreshCw size={14} className="animate-spin text-clay" />}
                </h1>
                <p className="text-xs text-charcoal-soft mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/orders"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-ivory text-xs font-semibold hover:bg-black transition shadow-xs"
              >
                <Package size={14} />
                <span>Track Orders ({orders.length})</span>
              </Link>
              <button
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-charcoal/15 bg-white text-charcoal text-xs font-semibold hover:bg-ivory transition"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* DASHBOARD TABS NAVIGATION */}
          <div className="flex border-b border-charcoal/10 overflow-x-auto gap-2 sm:gap-6 text-xs font-semibold uppercase tracking-wider pb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
              { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: MapPin },
              { id: 'profile', label: 'Personal Details', icon: UserIcon },
              { id: 'security', label: 'Security & Access', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`inline-flex items-center gap-2 pb-3.5 px-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-clay text-clay font-bold'
                      : 'border-transparent text-charcoal-soft hover:text-charcoal'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DASHBOARD CONTENT BODY */}
          {dashboardError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>{dashboardError}</span>
              <button
                onClick={() => void loadCustomerData(user)}
                className="font-bold underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Stat Cards */}
              <div
                onClick={() => setActiveTab('orders')}
                className="p-6 rounded-3xl bg-white border border-charcoal/10 shadow-xs cursor-pointer hover:border-clay/40 transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-clay/10 text-clay flex items-center justify-center">
                  <Package size={20} />
                </div>
                <span className="text-2xl font-serif font-bold text-charcoal block">
                  {orders.length}
                </span>
                <span className="text-xs font-semibold text-charcoal-soft uppercase tracking-wider block">
                  Total Orders Placed
                </span>
                <p className="text-[11px] text-clay font-medium pt-1 flex items-center gap-1">
                  <span>View Order History</span>
                  <ChevronRight size={12} />
                </p>
              </div>

              <div
                onClick={() => setActiveTab('addresses')}
                className="p-6 rounded-3xl bg-white border border-charcoal/10 shadow-xs cursor-pointer hover:border-clay/40 transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-clay/10 text-clay flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <span className="text-2xl font-serif font-bold text-charcoal block">
                  {addresses.length}
                </span>
                <span className="text-xs font-semibold text-charcoal-soft uppercase tracking-wider block">
                  Saved Shipping Addresses
                </span>
                <p className="text-[11px] text-clay font-medium pt-1 flex items-center gap-1">
                  <span>Manage Addresses</span>
                  <ChevronRight size={12} />
                </p>
              </div>

              <Link
                to="/wishlist"
                className="p-6 rounded-3xl bg-white border border-charcoal/10 shadow-xs cursor-pointer hover:border-clay/40 transition-all space-y-2 block"
              >
                <div className="w-10 h-10 rounded-xl bg-clay/10 text-clay flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <span className="text-2xl font-serif font-bold text-charcoal block">Wishlist</span>
                <span className="text-xs font-semibold text-charcoal-soft uppercase tracking-wider block">
                  Curated Saved Pieces
                </span>
                <p className="text-[11px] text-clay font-medium pt-1 flex items-center gap-1">
                  <span>Open Wishlist</span>
                  <ChevronRight size={12} />
                </p>
              </Link>

              {/* Recent Orders Preview */}
              <div className="md:col-span-2 rounded-3xl bg-white border border-charcoal/10 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-charcoal/8">
                  <h3 className="font-serif text-lg font-bold text-charcoal">Recent Orders</h3>
                  <Link
                    to="/orders"
                    className="text-xs font-semibold text-clay hover:underline uppercase tracking-wider"
                  >
                    View All Orders
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-charcoal-soft space-y-3">
                    <Package className="w-8 h-8 text-charcoal/30 mx-auto" />
                    <p>You have not placed any orders yet.</p>
                    <Link
                      to="/shop"
                      className="inline-block px-5 py-2 rounded-xl bg-charcoal text-ivory text-xs font-semibold uppercase tracking-wider"
                    >
                      Explore Catalogue
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-charcoal/8">
                    {orders.slice(0, 3).map((o) => (
                      <div
                        key={o.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-serif font-bold text-charcoal text-sm">
                            Order #{o.order_number || o.id.slice(0, 8)}
                          </span>
                          <span className="text-charcoal-soft block mt-0.5">
                            {new Date(o.placed_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOrderStatusBadge(
                              o.status
                            )}`}
                          >
                            {o.status.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-charcoal">{formatINR(Number(o.total))}</span>
                          <Link
                            to="/orders"
                            className="p-1 rounded-lg text-clay hover:bg-clay/10 transition"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications / Recent Alerts */}
              <div className="rounded-3xl bg-white border border-charcoal/10 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-charcoal/8">
                  <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2">
                    <Bell size={16} className="text-clay" />
                    <span>Recent Updates</span>
                  </h3>
                  <span className="text-[10px] text-charcoal-soft">{notifications.length} Alerts</span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-charcoal-soft py-8 text-center">
                    No new transaction updates at this time.
                  </p>
                ) : (
                  <div className="divide-y divide-charcoal/5 space-y-2 text-xs">
                    {notifications.map((n) => (
                      <div key={n.id} className="pt-2">
                        <span className="font-semibold text-charcoal block">{n.title}</span>
                        <p className="text-[11px] text-charcoal-soft mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-charcoal-light mt-1 block">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-charcoal/8">
                <div>
                  <h2 className="font-serif text-xl font-bold text-charcoal">Order History & Tracking</h2>
                  <p className="text-xs text-charcoal-soft mt-0.5">
                    View order status, real-time dispatch progress, and request returns or cancellations
                  </p>
                </div>
                <Link
                  to="/orders"
                  className="px-4 py-2 rounded-xl bg-charcoal text-ivory text-xs font-semibold hover:bg-black transition"
                >
                  Full Tracking View
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="py-16 text-center text-xs text-charcoal-soft space-y-3">
                  <Package className="w-10 h-10 text-charcoal/20 mx-auto" />
                  <p className="text-sm font-medium text-charcoal">No orders recorded in your client account.</p>
                  <p className="max-w-sm mx-auto">
                    When you purchase pieces across VJ Jewellery, Suits & Fabrics, Living, or Little Loom, they will appear here.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
                  >
                    Explore Shop Collections
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-charcoal/8">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-charcoal text-base">
                            Order #{o.order_number || o.id.slice(0, 8)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOrderStatusBadge(
                              o.status
                            )}`}
                          >
                            {o.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-charcoal-soft text-[11px] flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(o.placed_at).toLocaleDateString([], {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{o.payment_method} Payment</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-charcoal text-sm">{formatINR(Number(o.total))}</span>
                        <Link
                          to="/orders"
                          className="px-3.5 py-1.5 rounded-xl border border-charcoal/20 bg-white text-charcoal hover:bg-ivory transition font-semibold"
                        >
                          View Details & Tracking
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SAVED ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-charcoal/8">
                <div>
                  <h2 className="font-serif text-xl font-bold text-charcoal">Saved Delivery Addresses</h2>
                  <p className="text-xs text-charcoal-soft mt-0.5">
                    Manage your shipping locations for effortless checkout across India
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-ivory text-xs font-semibold hover:bg-black transition shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* NEW ADDRESS FORM MODAL/DRAWER */}
              {showAddressForm && (
                <form
                  onSubmit={handleSaveAddress}
                  className="p-5 rounded-2xl bg-[#FAF7F0] border border-charcoal/15 space-y-4 text-xs animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-charcoal/10">
                    <h3 className="font-serif font-bold text-charcoal text-sm">Add Shipping Address</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-charcoal-soft hover:text-charcoal font-bold text-sm"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        Address Nickname / Label
                      </label>
                      <input
                        type="text"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        placeholder="e.g. Home, Studio, Office"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        Recipient Full Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="6-digit PIN"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                      Street Address / House / Flat No.
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Apartment, building, and street details"
                      className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2 rounded-xl border border-charcoal/20 bg-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={isDefaultAddress}
                      onChange={(e) => setIsDefaultAddress(e.target.checked)}
                      className="rounded border-charcoal/20 text-clay"
                    />
                    <label htmlFor="isDefault" className="text-xs text-charcoal cursor-pointer">
                      Set as primary default delivery address
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 rounded-xl border border-charcoal/20 bg-white text-charcoal text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="px-5 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50 shadow-xs"
                    >
                      {isSavingAddress ? 'Saving…' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {/* ADDRESSES LIST */}
              {addresses.length === 0 && !showAddressForm ? (
                <div className="py-12 text-center text-xs text-charcoal-soft space-y-3">
                  <MapPin className="w-8 h-8 text-charcoal/30 mx-auto" />
                  <p>No saved addresses yet. Save your primary delivery address for instant checkout.</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-ivory text-xs font-semibold"
                  >
                    <Plus size={14} />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className="p-5 rounded-2xl border border-charcoal/10 bg-[#FAF7F0]/60 space-y-2 text-xs relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-sm text-charcoal">{a.label}</span>
                        {a.is_default && (
                          <span className="px-2 py-0.5 rounded-full bg-clay/10 text-clay text-[10px] font-bold uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-charcoal">{a.recipient_name}</p>
                      <p className="text-charcoal-soft leading-relaxed">
                        {a.address_line_1}
                        {a.address_line_2 && `, ${a.address_line_2}`}, {a.city}, {a.state} - {a.postal_code}
                      </p>
                      <p className="text-[11px] text-charcoal-soft flex items-center gap-1 pt-1">
                        <Phone size={11} />
                        <span>{a.phone}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. PERSONAL PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal">Personal Profile Details</h2>
                <p className="text-xs text-charcoal-soft mt-0.5">
                  Update your contact details associated with your luxury VJ Collection account
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                    Email Address (Registered Account)
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal/10 bg-ivory text-charcoal-soft cursor-not-allowed"
                  />
                  <span className="text-[10px] text-charcoal-light mt-1 block">
                    Account email is managed through secure credentials.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal/20 bg-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal/20 bg-white text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50 shadow-xs"
                  >
                    {isSavingProfile ? 'Saving Details…' : 'Save Personal Details'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 5. SECURITY & ACCESS TAB */}
          {activeTab === 'security' && (
            <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal">Security & Credentials</h2>
                <p className="text-xs text-charcoal-soft mt-0.5">
                  Manage password updates, authentication methods, and active session sign out
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-charcoal mb-1">
                    New Security Password
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter minimum 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal/20 bg-white text-xs"
                    required
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-xl bg-charcoal text-ivory text-xs font-semibold hover:bg-black transition disabled:opacity-50 shadow-xs"
                  >
                    {isUpdatingPassword ? 'Updating Password…' : 'Update Password'}
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-charcoal/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-serif font-bold text-charcoal text-sm block">Session Sign Out</span>
                  <p className="text-xs text-charcoal-soft">Sign out of this browser session safely.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition"
                >
                  Sign Out from Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

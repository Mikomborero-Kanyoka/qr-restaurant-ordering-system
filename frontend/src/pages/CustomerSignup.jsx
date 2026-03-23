import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { STAFF_SIGNUP_ROLE } from '../authProfile';
import { UserPlus, ArrowRight, Zap, ArrowLeft, ShieldCheck, Chrome, BriefcaseBusiness, Sparkles } from 'lucide-react';

if (!document.querySelector('[data-cs-fonts]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap';
  link.setAttribute('data-cs-fonts', '');
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.setAttribute('data-cs-styles', '');
  style.textContent = `
    .font-syne { font-family: 'Syne', sans-serif !important; }
    .font-dm   { font-family: 'DM Sans', sans-serif !important; }

    @keyframes cs-fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cs-pulse-ring {
      0%   { transform: scale(1); opacity: .5; }
      70%  { transform: scale(1.38); opacity: 0; }
      100% { transform: scale(1.38); opacity: 0; }
    }

    .anim-1 { animation: cs-fadeUp .5s .00s cubic-bezier(.22,1,.36,1) both; }
    .anim-2 { animation: cs-fadeUp .5s .08s cubic-bezier(.22,1,.36,1) both; }
    .anim-3 { animation: cs-fadeUp .5s .16s cubic-bezier(.22,1,.36,1) both; }
    .anim-4 { animation: cs-fadeUp .5s .24s cubic-bezier(.22,1,.36,1) both; }

    .pulse-ring {
      position: absolute; inset: 0; border-radius: 9999px;
      background: rgba(255,214,0,.35);
      animation: cs-pulse-ring 2.4s ease-out infinite;
    }

    .signup-btn { transition: all .18s cubic-bezier(.22,1,.36,1); }
    .signup-btn:hover  { transform: translateY(-2px); }
    .signup-btn:active { transform: scale(.97); }
  `;
  document.head.appendChild(style);
}

const inputCls =
  'w-full px-5 py-4 bg-gray-100 rounded-2xl border-2 border-transparent focus:border-[#FFD600] outline-none font-dm text-base text-[#0a0a0a] transition-all placeholder:text-gray-400';

export default function CustomerSignup() {
  const queryParams = new URLSearchParams(window.location.search);
  const mode = queryParams.get('mode') === 'staff' ? 'staff' : 'customer';
  const isStaffMode = mode === 'staff';
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const copy = useMemo(() => ({
    title: isStaffMode ? 'Join the\nCrew' : 'Join the\nClub',
    subtitle: isStaffMode ? 'Staff account onboarding' : 'Customer rewards signup',
    icon: isStaffMode ? <BriefcaseBusiness size={28} color="#fff" strokeWidth={2.4} /> : <UserPlus size={28} color="#0a0a0a" strokeWidth={2.5} />,
    usernameLabel: isStaffMode ? 'Full Name' : 'Username (3-15 chars)',
    usernamePlaceholder: isStaffMode ? 'Jamie Staff Member' : 'CoolCustomer123',
    emailPlaceholder: isStaffMode ? 'staff@example.com' : 'customer@example.com',
    submitLabel: isStaffMode ? 'Create Staff Account' : 'Create Account',
    successMessage: isStaffMode
      ? 'Staff account created. Check your email, then sign in and wait for admin branch assignment.'
      : 'Account created! Please check your email for a confirmation link.',
    postSuccess: isStaffMode
      ? 'After confirming, sign in from the staff portal. Admin will assign your branch and your manager will assign your role.'
      : 'Once confirmed, you can sign in and start ordering!',
    backLabel: isStaffMode ? 'Back to Staff Sign In' : 'Back to Sign In',
    heroBadge: isStaffMode ? 'Staff Onboarding' : 'Customer Rewards',
    heroNote: isStaffMode
      ? 'Step 1 of 3: create your account, get assigned to a branch, then receive your role.'
      : 'Create a customer profile to save receipts, follow orders, and unlock special deals.',
    shellBg: isStaffMode ? '#eef2ff' : '#f2f2f0',
    heroBg: isStaffMode ? 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' : '#0a0a0a',
    heroBadgeColor: isStaffMode ? '#c7d2fe' : '#FFD600',
    heroBadgeBg: isStaffMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,214,0,0.08)',
    heroBadgeBorder: isStaffMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,214,0,0.2)',
    heroTextColor: isStaffMode ? '#cbd5e1' : '#6b7280',
    cardBorder: isStaffMode ? 'rgba(99,102,241,0.14)' : 'rgba(0,0,0,0.06)',
    cardShadow: isStaffMode ? '0 24px 60px rgba(79,70,229,0.14)' : '0 16px 40px rgba(0,0,0,0.08)',
    summaryBg: isStaffMode ? 'linear-gradient(135deg, #111827 0%, #3730a3 100%)' : 'rgba(255,214,0,0.12)',
    summaryKicker: isStaffMode ? 'Staff account setup' : 'Customer account setup',
    summaryTitle: isStaffMode ? 'Built for employees joining the team' : 'Built for diners and loyalty members',
    summaryAccent: isStaffMode ? '#a5b4fc' : '#9a7e00',
    summaryText: isStaffMode ? '#e5e7eb' : '#0a0a0a',
    summaryChipBg: isStaffMode ? 'rgba(255,255,255,0.12)' : '#ffffff',
    summaryChipText: isStaffMode ? '#e2e8f0' : '#0a0a0a',
    summaryPoints: isStaffMode
      ? ['Work account only', 'Admin assigns branch', 'Manager assigns role']
      : ['Save receipts', 'Order history', 'Deals and rewards'],
    primaryBg: isStaffMode ? '#111827' : '#FFD600',
    primaryText: isStaffMode ? '#ffffff' : '#0a0a0a',
    primaryShadow: isStaffMode ? '0 4px 20px rgba(49,46,129,0.28)' : '0 4px 20px rgba(255,214,0,.3)',
    trustColor: isStaffMode ? '#818cf8' : '#d1d5db',
    trustLabel: isStaffMode ? 'Secure Staff Access Enabled' : 'Secure Dining Protocol Enabled',
  }), [isStaffMode]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isStaffMode && (username.length < 3 || username.length > 15)) {
      setError('Username must be between 3 and 15 characters.');
      return;
    }

    if (isStaffMode && username.trim().length < 3) {
      setError('Full name must be at least 3 characters.');
      return;
    }

    try {
      const signupRole = isStaffMode ? STAFF_SIGNUP_ROLE : 'customer';
      const normalizedName = username.trim();

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login',
          data: {
            role: signupRole,
            username: normalizedName,
          },
        },
      });

      if (signupError) throw signupError;

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            role: signupRole,
            username: normalizedName,
            email,
          }]);

        if (profileError) console.error('Profile creation error:', profileError);
      }

      if (data?.session) {
        navigate('/');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Signup failed.');
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="font-dm min-h-svh flex flex-col items-center pb-20" style={{ background: copy.shellBg }}>
      <div className="w-full px-6 pt-14 pb-24 flex flex-col items-center text-center relative overflow-hidden" style={{ background: copy.heroBg }}>
        <div className="absolute -top-10 -right-10 opacity-[0.04] rotate-12 pointer-events-none">
          <Zap size={220} color="#fff" fill="#fff" />
        </div>

        <div
          className="anim-1 inline-flex items-center gap-2 rounded-full border px-4 py-2 mb-6"
          style={{ background: copy.heroBadgeBg, borderColor: copy.heroBadgeBorder }}
        >
          {isStaffMode ? <BriefcaseBusiness size={14} color={copy.heroBadgeColor} /> : <Sparkles size={14} color={copy.heroBadgeColor} />}
          <span className="font-syne text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: copy.heroBadgeColor }}>
            {copy.heroBadge}
          </span>
        </div>

        <div className="anim-1 relative flex items-center justify-center mb-6">
          <div className="pulse-ring" style={{ width: 64, height: 64, inset: 'auto', borderRadius: '50%' }} />
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center z-10"
            style={{ background: isStaffMode ? 'rgba(255,255,255,0.12)' : '#FFD600' }}
          >
            {copy.icon}
          </div>
        </div>

        <h1 className="font-syne anim-2 text-5xl font-black text-white leading-none tracking-tight mb-3">
          {copy.title.split('\n').map((part, index) => (
            <React.Fragment key={part}>
              {index > 0 && <br />}
              {part}
            </React.Fragment>
          ))}
        </h1>
        <p className="anim-3 font-syne text-xs font-semibold uppercase tracking-widest" style={{ color: copy.heroTextColor }}>
          {copy.subtitle}
        </p>
        <p className="anim-4 max-w-md mt-5 text-sm leading-6" style={{ color: isStaffMode ? '#cbd5e1' : '#a3a3a3' }}>
          {copy.heroNote}
        </p>
      </div>

      <div className="w-full max-w-md px-4 -mt-12 z-10">
        <div className="anim-2 flex rounded-[20px] p-1 mb-5" style={{ background: isStaffMode ? 'rgba(15,23,42,0.08)' : 'rgba(10,10,10,0.08)' }}>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="flex-1 rounded-2xl px-4 py-3 font-syne text-xs font-extrabold uppercase tracking-[0.16em] transition-all"
            style={{
              background: !isStaffMode ? '#ffffff' : 'transparent',
              color: !isStaffMode ? '#0a0a0a' : '#64748b',
              boxShadow: !isStaffMode ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Customer Sign Up
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup?mode=staff')}
            className="flex-1 rounded-2xl px-4 py-3 font-syne text-xs font-extrabold uppercase tracking-[0.16em] transition-all"
            style={{
              background: isStaffMode ? '#111827' : 'transparent',
              color: isStaffMode ? '#ffffff' : '#64748b',
              boxShadow: isStaffMode ? '0 10px 24px rgba(15,23,42,0.22)' : 'none',
            }}
          >
            Staff Sign Up
          </button>
        </div>

        <div
          className="anim-3 bg-white rounded-3xl border px-8 py-10"
          style={{ borderColor: copy.cardBorder, boxShadow: copy.cardShadow }}
        >
          <div className="rounded-[24px] p-5 mb-6" style={{ background: copy.summaryBg }}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="font-syne text-xs font-bold uppercase tracking-[0.16em]" style={{ color: copy.summaryAccent }}>
                  {copy.summaryKicker}
                </p>
                <p className="font-syne text-lg font-black mt-2" style={{ color: copy.summaryText }}>
                  {copy.summaryTitle}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: isStaffMode ? 'rgba(255,255,255,0.12)' : '#0a0a0a' }}
              >
                {isStaffMode ? <BriefcaseBusiness size={24} color="#ffffff" /> : <UserPlus size={24} color="#FFD600" />}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {copy.summaryPoints.map((point) => (
                <span
                  key={point}
                  className="font-syne text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-2 rounded-full"
                  style={{ background: copy.summaryChipBg, color: copy.summaryChipText }}
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 font-syne font-bold text-sm uppercase tracking-wide mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-600 font-syne font-bold text-sm uppercase tracking-wide mb-6">
              {copy.successMessage}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <label className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
                  {copy.usernameLabel}
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={copy.usernamePlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
                  Email Address
                </label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
                  Password
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="signup-btn w-full font-syne font-extrabold text-base uppercase tracking-wide py-5 rounded-2xl flex items-center justify-center gap-2.5 mt-2"
                style={{ background: copy.primaryBg, color: copy.primaryText, boxShadow: copy.primaryShadow }}
              >
                {copy.submitLabel} <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="font-dm text-gray-500 mb-8">
                {copy.postSuccess}
              </p>
              <Link
                to="/login"
                className="signup-btn inline-block w-full font-syne font-extrabold text-base uppercase tracking-wide py-5 rounded-2xl text-center"
                style={{ background: copy.primaryBg, color: copy.primaryText, boxShadow: copy.primaryShadow }}
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {!isStaffMode && (
            <>
              <div style={{ margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }} />
                <span style={{ fontSize: 12, color: '#999' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }} />
              </div>

              <button
                onClick={handleGoogleSignup}
                className="signup-btn w-full bg-white text-[#0a0a0a] border border-gray-200 font-syne font-bold text-sm uppercase tracking-wide py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              >
                <Chrome size={18} /> Sign up with Google
              </button>
            </>
          )}

          <div className="mt-8 pt-7 border-t border-gray-100 flex flex-col items-center gap-4">
            <p className="font-dm text-sm text-gray-400">Already have an account?</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-syne font-bold text-sm uppercase tracking-wide text-[#0a0a0a] hover:text-[#9a7e00] transition-colors"
            >
              <ArrowLeft size={15} /> {copy.backLabel}
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2" style={{ color: copy.trustColor }}>
            <ShieldCheck size={13} />
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest">
              {copy.trustLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

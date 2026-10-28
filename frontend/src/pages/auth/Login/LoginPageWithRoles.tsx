import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store/store';
import { login as loginAction } from '../../../store/slices/auth.slice';
import { ROLE_CONFIGS } from '../../../config/roleConfig';

export const LoginPageWithRoles: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessRequestSuccess, setAccessRequestSuccess] = useState('');
  const [unauthorizedRole, setUnauthorizedRole] = useState<string | null>(null);

  // Check URL params for error from Microsoft SSO
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const roleCodeParam = searchParams.get('roleCode');
    const emailParam = searchParams.get('email');

    if (errorParam === 'unauthorized_role' && roleCodeParam) {
      setUnauthorizedRole(roleCodeParam);
      setError(`You don't have access to ${roleCodeParam}. Click "Request Access" to apply.`);
    } else if (errorParam === 'user_not_found' && emailParam) {
      setError(`No account found for ${emailParam}. Please contact your administrator.`);
    } else if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      setLoading(true);
      setError('');

      console.log('Attempting login with:', loginEmail, '/ password length:', loginPassword.length);

      // Use Redux login action - this will update the store properly
      await dispatch(loginAction({ email: loginEmail, password: loginPassword })).unwrap();

      console.log('Login successful, navigating to dashboard...');

      // Navigate to dashboard
      navigate('/hub/ap/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(typeof err === 'string' ? err : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSSO = (roleCode: string) => {
    // Redirect to Microsoft OAuth
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiUrl.replace('/api', '');
    window.location.href = `${baseUrl}/api/auth/microsoft/login?roleCode=${roleCode}`;
  };

  const handleRequestAccess = async (roleCode: string, roleName: string) => {
    try {
      setRequestingAccess(true);
      setError('');
      setAccessRequestSuccess('');

      const userEmail = prompt(`Enter your email address to request access to ${roleName}:`);
      if (!userEmail) return;

      const message = prompt('Optional: Add a message for the admin (reason for access):') || '';

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/auth/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          roleCode,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAccessRequestSuccess(`Access request submitted for ${roleName}! An admin will review your request.`);
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Request access error:', err);
      setError('Failed to submit access request');
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      handleLogin(email, password);
    }
  };

  const roleCards = Object.values(ROLE_CONFIGS);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">ASIANET · AP COMMAND CENTER</h1>
            </div>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Invoice ingestion, DOA approvals &<br />
              GST compliance — one portal.
            </h2>
            <p className="text-lg text-purple-100">
              Centralised vendor invoice processing for Asianet Satellite Communications Ltd —<br />
              digital cable TV, broadband & OTT across South India.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/30 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">Single AP Mailbox</h3>
              </div>
              <p className="text-sm text-purple-100">7,000 invoices/month auto-ingested with unique ASCL references</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500/30 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">Category DOA Engine</h3>
              </div>
              <p className="text-sm text-purple-100">10 categories · 5 tiers · auto-escalation at 72 hrs</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-500/30 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">CFO Cockpit</h3>
              </div>
              <p className="text-sm text-purple-100">ITC at risk, MSME 43B(h), DPO & vendor concentration</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-3xl font-bold">2,000</p>
              <p className="text-sm text-purple-200">MOCK INVOICES</p>
            </div>
            <div>
              <p className="text-3xl font-bold">10</p>
              <p className="text-sm text-purple-200">CATEGORIES</p>
            </div>
            <div>
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm text-purple-200">DOA TIERS</p>
            </div>
            <div>
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm text-purple-200">DEMO ROLES</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl px-12 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select your role to sign in with Microsoft SSO 🔐
          </p>

            {/* Success Message */}
            {accessRequestSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                {accessRequestSuccess}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Role Cards - 3x2 Grid (3 columns, 2 rows) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {roleCards.map((role) => (
                <div
                  key={role.code}
                  className="relative flex flex-col items-center justify-between py-4 px-3 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group bg-white"
                >
                  <div className="flex flex-col items-center mb-3">
                    <div className={`${role.color} rounded-lg w-12 h-12 flex items-center justify-center mb-2`}>
                      <span className="text-white font-bold text-lg">{role.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm mb-1">{role.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{role.description}</p>
                    </div>
                  </div>

                  {/* SSO and Request Access buttons */}
                  <div className="w-full space-y-2">
                    {/* Microsoft SSO - Always visible */}
                    <button
                      onClick={() => handleMicrosoftSSO(role.code)}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-md"
                      title="Sign in with Microsoft"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                      </svg>
                      <span>Microsoft SSO</span>
                    </button>

                    {/* Request Access - Show if unauthorized */}
                    {unauthorizedRole === role.code && (
                      <button
                        onClick={() => handleRequestAccess(role.code, role.name)}
                        disabled={requestingAccess}
                        className="w-full py-2 px-3 bg-amber-50 text-amber-700 border-2 border-amber-300 rounded-md hover:bg-amber-100 transition-colors text-xs font-semibold disabled:opacity-50"
                        title="Request access to this role"
                      >
                        🔒 Request Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500 font-medium">OR SIGN IN MANUALLY (Without SSO)</span>
              </div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              {/* Dev credentials hint */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2"><strong>Test Credentials:</strong></p>
                <div className="space-y-1">
                  <p className="text-blue-600"><span className="font-semibold">Admin:</span> <span className="font-mono">admin@acme.com / password123</span></p>
                  <p className="text-blue-600"><span className="font-semibold">CFO:</span> <span className="font-mono">cfo@acme.com / password123</span></p>
                  <p className="text-blue-600"><span className="font-semibold">AP Clerk:</span> <span className="font-mono">clerk@acme.com / password123</span></p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </div>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@asianet.co.in"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Sign In Securely
                  </>
                )}
              </button>
            </form>

          {/* Demo Credentials Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Demo credentials:</strong> All roles use admin@acme.com / password123 for now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

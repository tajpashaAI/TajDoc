import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (token: string, role: string, user: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter the master password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid password.');
      }

      onLoginSuccess(data.token, data.role || 'superadmin', data.user || 'admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 border-2 border-black p-8 bg-white text-black">
      <div className="border-b border-black pb-3 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">AUTHENTICATION REQUIRED</h2>
          <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5">PROTECTED</span>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
          Enter master password for Super Admin privileges
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="master-password-input" className="block text-xs font-bold uppercase tracking-wider mb-2">
            Master Access Key
          </label>
          <input
            id="master-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            autoFocus
            className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono tracking-widest"
          />
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            Default Key: <span className="font-bold text-black select-all">tajdoc2026</span>
          </div>
        </div>

        {error && (
          <div id="login-error-msg" className="p-3 bg-red-50 border border-black text-xs font-mono font-bold text-red-700">
            {error}
          </div>
        )}

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3.5 font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? 'Verifying...' : 'Unlock PDF Tools'}
        </button>
      </form>
    </div>
  );
}

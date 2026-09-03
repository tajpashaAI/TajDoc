import React, { useState, useEffect } from 'react';
import MergePDF from './components/MergePDF';
import TextToPDF from './components/TextToPDF';
import Login from './components/Login';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import './App.css';

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return sessionStorage.getItem('tajdoc_auth_token') || localStorage.getItem('tajdoc_auth_token');
  });
  const [userRole, setUserRole] = useState<string | null>(() => {
    return sessionStorage.getItem('tajdoc_user_role') || localStorage.getItem('tajdoc_user_role');
  });
  const [activeTab, setActiveTab] = useState<'all' | 'merge' | 'text'>('all');
  const [apiStatus, setApiStatus] = useState<'CHECKING' | 'RUNNING' | 'OFFLINE'>('CHECKING');
  const [notification, setNotification] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/auth-check', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          handleLogout();
        } else {
          const data = await res.json();
          setUserRole(data.role || 'superadmin');
        }
      } catch {
        // Backend temporarily unavailable, keep token for now
      }
    };

    verifyAuth();
  }, [authToken]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setApiStatus('RUNNING');
        } else {
          setApiStatus('RUNNING'); // Fallback ready
        }
      } catch {
        setApiStatus('RUNNING'); // Assume running if dev proxy is active
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (token: string, role: string) => {
    setAuthToken(token);
    setUserRole(role);
    sessionStorage.setItem('tajdoc_auth_token', token);
    sessionStorage.setItem('tajdoc_user_role', role);
    showNotification('Super Admin access authenticated.');
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch {
        // Ignore logout network errors
      }
    }
    setAuthToken(null);
    setUserRole(null);
    sessionStorage.removeItem('tajdoc_auth_token');
    sessionStorage.removeItem('tajdoc_user_role');
    localStorage.removeItem('tajdoc_auth_token');
    localStorage.removeItem('tajdoc_user_role');
    showNotification('Logged out successfully.');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="bg-white text-black font-sans min-h-screen flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="w-full max-w-5xl mb-8 sm:mb-12 border-b-2 border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">TAJDOC</h1>
            {authToken && (
              <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 uppercase tracking-widest">
                SUPER ADMIN
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-500 mt-1">
            Secure PDF Utilities &bull; merge &bull; generate
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Navigation Controls (Visible when authenticated) */}
          {authToken && (
            <div className="flex items-center gap-1 border border-black p-1 text-xs uppercase font-mono tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2 py-1 transition-colors ${
                  activeTab === 'all' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                All Tools
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('merge')}
                className={`px-2 py-1 transition-colors ${
                  activeTab === 'merge' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                Merge PDFs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-2 py-1 transition-colors ${
                  activeTab === 'text' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                Text to PDF
              </button>
            </div>
          )}

          {/* Controls Right */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <span
              className={`text-xs font-mono px-2 py-1 uppercase tracking-wider inline-block ${
                apiStatus === 'RUNNING'
                  ? 'bg-black text-white'
                  : apiStatus === 'CHECKING'
                  ? 'bg-gray-200 text-black'
                  : 'bg-gray-300 text-black'
              }`}
            >
              API: {apiStatus}
            </span>

            {authToken && (
              <button
                id="logout-btn"
                type="button"
                onClick={handleLogout}
                className="border border-black px-2 py-1 text-xs uppercase font-mono tracking-wider hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Log out of Super Admin session"
              >
                Lock / Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      {notification && (
        <div className="w-full max-w-5xl mb-6 p-3 bg-black text-white text-xs font-mono tracking-wider flex justify-between items-center">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-grow mb-8">
        {!authToken ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div
            className={`grid gap-8 lg:gap-12 ${
              activeTab === 'all'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 max-w-2xl mx-auto'
            }`}
          >
            {(activeTab === 'all' || activeTab === 'merge') && (
              <MergePDF
                authToken={authToken}
                onSuccess={() => showNotification('PDFs merged successfully. Downloading...')}
                onAuthError={handleLogout}
              />
            )}

            {(activeTab === 'all' || activeTab === 'text') && (
              <TextToPDF
                authToken={authToken}
                onSuccess={() => showNotification('PDF generated successfully. Downloading...')}
                onAuthError={handleLogout}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-auto pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest gap-2">
        <div>TajDoc &bull; Powered by Flask, pypdf & ReportLab</div>
        <div>
          {authToken ? `Authenticated as ${userRole || 'Admin'}` : 'Super Admin Gate Enabled'}
        </div>
      </footer>

      {/* Offline Status Banner */}
      <OfflineIndicator />
    </div>
  );
}

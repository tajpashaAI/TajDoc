import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on the mobile device, hide install prompt
  if (isInstalled) {
    return (
      <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 uppercase tracking-wider hidden sm:inline-block">
        APP INSTALLED
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isInstallable ? (
          <button
            id="pwa-install-btn"
            type="button"
            onClick={install}
            className="flex items-center gap-1.5 border-2 border-black bg-black text-white px-2.5 py-1 text-xs font-mono uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer"
            title="Install TajDoc as an Android or mobile application"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Install App</span>
          </button>
        ) : (
          <button
            id="pwa-mobile-guide-btn"
            type="button"
            onClick={() => {
              if (isIOS) setShowIOSGuide(true);
              else setShowAndroidGuide(true);
            }}
            className="flex items-center gap-1.5 border border-black bg-white text-black px-2.5 py-1 text-xs font-mono uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
            title="How to install on Android mobile or tablet"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
              <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>Mobile App</span>
          </button>
        )}
      </div>

      {/* Android Installation Modal Guide */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white border-2 border-black p-6 text-black">
            <div className="flex justify-between items-center border-b border-black pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5">ANDROID</span>
                <h3 className="text-base font-bold uppercase tracking-tight">Install on Mobile / Tablet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="text-sm font-bold hover:text-gray-600 px-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              You can run <strong>TajDoc</strong> directly on your Android phone or tablet as a standalone app with full-screen experience and home screen icon:
            </p>

            <ol className="space-y-3 text-xs font-mono mb-6 bg-gray-50 p-4 border border-black">
              <li className="flex gap-2">
                <span className="font-bold bg-black text-white px-1.5 py-0.2 shrink-0">1</span>
                <span>Open your public URL (e.g. on Render or Cloud Run) in <strong>Chrome</strong> on your Android device.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold bg-black text-white px-1.5 py-0.2 shrink-0">2</span>
                <span>Tap the <strong>three dots menu (⋮)</strong> in Chrome’s top right corner.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold bg-black text-white px-1.5 py-0.2 shrink-0">3</span>
                <span>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold bg-black text-white px-1.5 py-0.2 shrink-0">4</span>
                <span>Tap <strong>Install</strong>. TajDoc icon will appear on your Android launcher!</span>
              </li>
            </ol>

            <div className="border border-black p-3 text-[11px] text-gray-700 bg-gray-100 mb-4 font-mono">
              💡 <strong>Direct APK conversion:</strong> You can also paste your URL into <strong>PWABuilder.com</strong> to generate a ready-to-install Android APK / Play Store bundle!
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full bg-black text-white py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* iOS Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white border-2 border-black p-6 text-black">
            <div className="flex justify-between items-center border-b border-black pb-3 mb-4">
              <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5">iOS</span>
              <h3 className="text-base font-bold uppercase tracking-tight">Install on iPhone / iPad</h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-sm font-bold hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              1. Open Safari and tap the <strong>Share</strong> button (box with upward arrow).<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top right.
            </p>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-black text-white py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-gray-800 mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

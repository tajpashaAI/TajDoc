import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between gap-3 border-2 border-black bg-black text-white px-4 py-2 text-xs font-mono tracking-wider shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span>OFFLINE MODE — Network disconnected</span>
      </div>
    </div>
  );
};

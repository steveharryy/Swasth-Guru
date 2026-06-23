'use client';

/**
 * BackendStatusPanel - Rural & Villager-friendly version
 * ─────────────────────────────────────────────────────────────────────────
 * Replaces technical terms (JWT, RBAC, Socket, metrics) with a simple
 * internet/network indicator in Hindi and English.
 */

import { useState, useEffect, useCallback } from 'react';
import { onSocketStateChange, type SocketConnectionState } from '@/lib/socket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline';
}

const SERVICES = [
  { name: 'API Gateway', path: '/health' },
];

export function BackendStatusPanel() {
  const { language } = useLanguage();
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map(s => ({ name: s.name, url: s.path, status: 'checking' }))
  );
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkServices = useCallback(async () => {
    setIsRefreshing(true);
    const results = await Promise.all(
      SERVICES.map(async (svc) => {
        try {
          const res = await fetch(`${API_BASE}${svc.path}`, { signal: AbortSignal.timeout(5000) });
          return {
            name: svc.name,
            url: svc.path,
            status: res.ok ? 'online' : 'offline',
          } as ServiceStatus;
        } catch {
          return { name: svc.name, url: svc.path, status: 'offline' } as ServiceStatus;
        }
      })
    );
    setServices(results);
    setLastCheck(new Date());
    setIsRefreshing(false);
  }, []);

  // Initial load + periodic refresh
  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 45_000);
    return () => clearInterval(interval);
  }, [checkServices]);

  // Socket state listener
  useEffect(() => {
    const unsub = onSocketStateChange(setSocketState);
    return () => unsub();
  }, []);

  const allOnline = services.every(s => s.status === 'online') && socketState === 'connected';
  const anyOffline = services.some(s => s.status === 'offline') || socketState === 'disconnected';

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      anyOffline
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            anyOffline ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          }`}>
            {allOnline ? (
              <Wifi className="w-6 h-6 animate-pulse text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base font-bold">
              {allOnline ? (
                <>
                  <span className="block sm:inline">✔ App Status: Connected & Working</span>
                  <span className="block sm:inline sm:ml-2 sm:pl-2 sm:border-l border-current/30 font-medium text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    ● सब ठीक है - ऐप चालू है
                  </span>
                </>
              ) : (
                <>
                  <span className="block sm:inline">⚠ Network Issue: Retrying...</span>
                  <span className="block sm:inline sm:ml-2 sm:pl-2 sm:border-l border-current/30 font-medium text-sm text-amber-600/80 dark:text-amber-300/80">
                    ● इंटरनेट या सर्वर समस्या - प्रयास जारी है
                  </span>
                </>
              )}
            </p>
            <p className="text-xs opacity-75 mt-0.5">
              {language === 'hindi' 
                ? `आखिरी जांच: ${lastCheck.toLocaleTimeString('hi-IN')}` 
                : `Last checked: ${lastCheck.toLocaleTimeString('en-US')}`
              }
            </p>
          </div>
        </div>

        <button
          onClick={checkServices}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-current/20 bg-white/5 hover:bg-white/10 active:scale-95 transition-all ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {language === 'hindi' ? 'रीफ्रेश करें' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

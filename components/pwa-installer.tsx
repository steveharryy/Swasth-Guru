'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="pwa-prompt">
      <Card className="p-4 shadow-lg border glass-effect">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="font-bold text-primary">SG</span>
            </div>
            <div>
              <h3 className="font-semibold">Install SwasthGuru</h3>
              <p className="text-sm text-muted-foreground">Get the full app experience</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm">
            Not now
          </Button>
        </div>
      </Card>
    </div>
  );
}
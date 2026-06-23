'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function VibrantBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'hsl(38 60% 97%)' }}>
      {/* Warm mesh gradient — teal top-left, saffron bottom-right, amber centre */}
      <div
        className="absolute inset-0 opacity-[0.18] blur-[130px]"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, rgba(26,138,122,0.45) 0%, transparent 55%),
            radial-gradient(circle at 85% 15%, rgba(240,128,32,0.30) 0%, transparent 55%),
            radial-gradient(circle at 50% 85%, rgba(251,191,36,0.25) 0%, transparent 50%),
            radial-gradient(circle at 10% 85%, rgba(26,138,122,0.18) 0%, transparent 50%)
          `
        }}
      />

      {/* Floating teal orb — top left */}
      <motion.div
        animate={{ x: [0, 90, -40, 0], y: [0, -130, 60, 0], scale: [1, 1.15, 0.92, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full blur-[140px]"
        style={{ background: 'rgba(26,138,122,0.18)' }}
      />

      {/* Floating saffron orb — bottom right */}
      <motion.div
        animate={{ x: [0, -110, 70, 0], y: [0, 180, -80, 0], scale: [1, 0.82, 1.12, 1] }}
        transition={{ duration: 31, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-1/4 right-1/4 w-[560px] h-[560px] rounded-full blur-[150px]"
        style={{ background: 'rgba(240,128,32,0.15)' }}
      />

      {/* Floating amber orb — centre bottom */}
      <motion.div
        animate={{ x: [0, 70, -90, 0], y: [0, 90, 140, 0], scale: [1, 1.25, 0.75, 1] }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className="absolute top-3/4 left-1/2 w-[380px] h-[380px] rounded-full blur-[130px]"
        style={{ background: 'rgba(251,191,36,0.14)' }}
      />

      {/* Subtle warm dot-grid overlay (Indian motif feel) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(26,138,122,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
    </div>
  );
}

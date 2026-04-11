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
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* Mesh Gradient Layer */}
      <div 
        className="absolute inset-0 opacity-[0.2] blur-[120px]"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)
          `
        }}
      />


      {/* Animated Floating Orbs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -150, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[140px] rounded-full"
      />

      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 200, -100, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 blur-[150px] rounded-full"
      />

      <motion.div
        animate={{
          x: [0, 80, -100, 0],
          y: [0, 100, 150, 0],
          scale: [1, 1.3, 0.7, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-3/4 left-1/2 w-[400px] h-[400px] bg-accent/20 blur-[130px] rounded-full"
      />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}

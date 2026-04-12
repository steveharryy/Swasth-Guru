'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Camera, Upload, RefreshCw, Info, AlertTriangle, CheckCircle2, Sparkles, BrainCircuit, ShieldCheck, Microscope } from 'lucide-react';
import { analyzeSymptomImage, SymptomAnalysis } from '@/lib/ai-api';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getApiUrl } from '@/lib/utils';

export function DhanvantariDrishti() {
    const { user } = useUser();
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<SymptomAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setResult(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setAnalyzing(true);
        setError(null);
        try {
            const analysis = await analyzeSymptomImage(image);
            setResult(analysis);

            // Store in database via backend
            try {
                const apiUrl = getApiUrl();
                await fetch(`${apiUrl}/users/symptom-scans`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patientId: user?.id,
                        imageUrl: 'placeholder-url',
                        aiAnalysis: analysis,
                        possibleCondition: analysis.possibleCondition,
                        precautions: analysis.precautions,
                    }),
                });
            } catch (dbErr) {
                console.error('Database storage failed (ignoring):', dbErr);
            }
        } catch (err: any) {
            console.error('Analysis failed:', err);
            setError(err.message || 'Analysis failed. Please try again with a clearer image.');
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setImage(null);
        setResult(null);
        setError(null);
    };

    return (
        <Card className="vibrant-card border overflow-hidden group">
            <CardHeader className="border-b pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-black logo-text tracking-tighter flex items-center gap-3 text-slate-900">
                            <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
                            Dhanvantari Drishti
                        </CardTitle>
                        <CardDescription className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                             Neural Health Vision &bull; 2026
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-10">
                <AnimatePresence mode="wait">
                    {!image ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center cursor-pointer hover:bg-slate-50 hover:border-primary/40 transition-all duration-500 relative group/upload"
                        >
                            <div className="flex flex-col items-center gap-6">
                                <motion.div 
                                    whileHover={{ rotate: 180 }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                    className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10"
                                >
                                    <Camera className="w-10 h-10 text-primary" />
                                </motion.div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Acquire Medical Visuals</h3>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        Scan skin concerns, wounds, or swelling for immediate AI diagnosis.
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="h-14 px-10 rounded-2xl border-slate-200 bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white hover:border-primary transition-all duration-500"
                                >
                                    Choose File Protocol
                                </Button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-10"
                        >
                            <div className="relative rounded-[2.5rem] overflow-hidden aspect-video bg-black/40 border border-white/5 group/preview shadow-3xl">
                                <Image
                                    src={image}
                                    alt="Symptom"
                                    fill
                                    className="object-contain"
                                />
                                
                                {analyzing && (
                                    <motion.div 
                                        initial={{ top: "-100%" }}
                                        animate={{ top: "100%" }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-[2px] z-20 shadow-[0_0_15px_rgba(124,58,237,0.8)]"
                                    />
                                )}

                                {!analyzing && !result && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={reset}
                                        className="absolute top-6 right-6 w-12 h-12 bg-rose-500/20 backdrop-blur-md border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </div>

                            {error && (
                                <motion.div 
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="bg-rose-500/10 text-rose-500 p-6 rounded-[2rem] flex items-center gap-4 border border-rose-500/10"
                                >
                                    <AlertTriangle className="w-6 h-6 shrink-0" />
                                    <p className="text-sm font-black uppercase tracking-wider">{error}</p>
                                </motion.div>
                            )}

                            {!result ? (
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="glowing-button w-full h-24 text-2xl font-black rounded-[2.5rem] shadow-2xl flex items-center justify-center group"
                                >
                                    {analyzing ? (
                                        <div className="flex items-center gap-6">
                                            <RefreshCw className="h-8 w-8 animate-spin" />
                                            <span className="uppercase tracking-[0.2em]">Processing Core...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                                            <span className="uppercase tracking-[0.1em]">Trigger Neural Scan</span>
                                        </div>
                                    )}
                                </Button>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group">
                                            <Microscope className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-100 group-hover:text-primary/10 transition-colors" />
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3">AI Prediction</p>
                                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{result.possibleCondition}</h4>
                                        </div>
                                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-3">Protocol Recommendation</p>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed">{result.recommendation}</p>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                            <Info className="w-4 h-4 text-primary" />
                                            Clinical Insight
                                        </p>
                                        <p className="text-lg text-slate-800 font-semibold leading-relaxed">{result.description}</p>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden">
                                        <ShieldCheck className="absolute -top-6 -right-6 w-32 h-32 text-primary/10" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Safety Precautions
                                        </p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {result.precautions.map((precaution, idx) => (
                                                <li key={idx} className="text-sm text-slate-600 font-black flex items-center gap-4 group">
                                                    <span className="w-12 h-1 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                                                    {precaution}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button 
                                            onClick={reset} 
                                            variant="ghost" 
                                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        >
                                            Reset Core Session
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative overflow-hidden group">
                    <div className="flex items-start gap-4 relative z-10">
                        <AlertCircle className="w-5 h-5 text-slate-300 mt-1" />
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-loose tracking-[0.2em]">
                            <span className="text-primary/60 mr-2">PROTOCOL 00-A:</span>
                            This analysis is synthesized by your local neural node. Not a clinical diagnosis. Consult medical personnel for physical validation.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

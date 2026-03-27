'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Camera, Upload, RefreshCw, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { analyzeSymptomImage, SymptomAnalysis } from '@/lib/ai-api';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

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

            // Store in database via backend (optional - dont fail if db fails)
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                await fetch(`${apiUrl}/users/symptom-scans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patientId: user?.id,
                        imageUrl: 'placeholder-url', // In a real app, upload to Supabase Storage first
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
        <Card className="border-2 border-primary/20 shadow-lg overflow-hidden transition-all duration-300 hover:border-primary/40 group">
            <CardHeader className="bg-primary/5 py-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform duration-300">👁️</span>
                        धन्वन्तरि दृष्टि (Dhanvantari Drishti)
                    </CardTitle>
                    <CardDescription className="font-medium mt-1">AI-Powered Health Vision Insights</CardDescription>
                </div>
                <Info className="text-primary/40 w-5 h-5" />
            </CardHeader>
            <CardContent className="p-6">
                {!image ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/20 rounded-2xl p-10 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 group/upload"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300">
                                <Camera className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">Upload or Take Photo</p>
                                <p className="text-sm text-muted-foreground mt-1">Skin issues, rashes, wounds, or swelling</p>
                            </div>
                            <Button variant="outline" className="mt-2 rounded-xl border-primary/40 text-primary font-bold">
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                            </Button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted border group/preview">
                            <Image
                                src={image}
                                alt="Symptom"
                                fill
                                className="object-contain"
                            />
                            {!analyzing && !result && (
                                <Button
                                    onClick={reset}
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-4 right-4 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {!result ? (
                            <Button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full h-14 text-lg font-black rounded-xl shadow-xl hover:shadow-primary/20 transition-all"
                            >
                                {analyzing ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                        Analyzing your health vision...
                                    </>
                                ) : (
                                    <>
                                        <span className="mr-2">✨</span>
                                        Generate AI Insights
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Possible Condition</p>
                                        <h4 className="text-xl font-black text-foreground">{result.possibleCondition}</h4>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Recommendation</p>
                                        <p className="text-sm font-bold text-foreground">{result.recommendation}</p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-card border">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        Description
                                    </p>
                                    <p className="text-base text-foreground font-medium leading-relaxed">{result.description}</p>
                                </div>

                                <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Precautions
                                    </p>
                                    <ul className="space-y-2">
                                        {result.precautions.map((precaution, idx) => (
                                            <li key={idx} className="text-sm text-foreground font-semibold flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                                                {precaution}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={reset} variant="outline" className="flex-1 h-12 rounded-xl font-bold">
                                        Scan New Image
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-dashed border-muted-foreground/20">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase leading-tight tracking-wide">
                            Medical Disclaimer: This AI analysis is for informational purposes only and should not be considered a medical diagnosis. Please consult a qualified doctor for proper treatment.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

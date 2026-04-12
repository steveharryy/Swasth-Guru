"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VibrantBackground } from "@/components/ui/vibrant-background";
import { UserRound, Stethoscope, Loader2, CheckCircle2, ShieldCheck, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { MEDICAL_SPECIALIZATIONS } from "@/lib/specializations";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";


interface UserMetadata {
    onboardingComplete?: boolean;
    role?: "patient" | "doctor";
    phone?: string;
    age?: string;
    gender?: string;
    specialization?: string;
    experience?: string;
}

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [role, setRole] = useState<"patient" | "doctor" | null>(null);
    const [formData, setFormData] = useState({
        phone: "",
        age: "",
        gender: "",
        dob: "",
        emergencyContact: "",
        specialization: "",
        experience: "",
        medicalCouncil: "",
        licenseNumber: "",
        qualifications: "",
        consultationFee: "11",
        bio: "",
        address: "",
        bloodGroup: "",
        height: "",
        weight: "",
        allergies: "",
        currentMedications: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            const metadata = user.unsafeMetadata as UserMetadata;
            if (metadata.onboardingComplete) {
                router.push(`/${metadata.role}/dashboard`);
            }
        }
    }, [isLoaded, user, router]);

    const handleRoleSelect = (selectedRole: "patient" | "doctor") => {
        setRole(selectedRole);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let finalValue = value;

        if (type === 'number' && value !== '') {
            if (parseFloat(value) < 0) finalValue = '0';
        }

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    const preventNegative = (e: React.KeyboardEvent) => {
        if (e.key === '-' || e.key === 'e') {
            e.preventDefault();
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleVerifyLicense = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!formData.medicalCouncil) {
            toast.error("Please select your State Medical Council first.");
            return;
        }
        if (!formData.licenseNumber) {
            toast.error("Please enter a Medical License Number.");
            return;
        }

        setIsVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const enteredLicense = formData.licenseNumber.trim().toUpperCase();
        const demoIds = ["DMC-25578", "MMC-80546", "NMC-10928", "NMC-10925"];
        
        // Match standard medical license formats (Prefix-Numbers)
        const isValidFormat = /^[A-Z]{2,3}-\d{4,8}$/.test(enteredLicense);

        if (!demoIds.includes(enteredLicense) && !isValidFormat) {
            setIsVerifying(false);
            toast.error("❌ Invalid format. Use (Council-ID) e.g., NMC-12345");
            return;
        }

        setIsVerifying(false);
        setIsVerified(true);
        toast.success("License Verified successfully!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) return;

        setIsSubmitting(true);
        try {
            if (!user) {
                throw new Error("User not found");
            }

            await user.update({
                unsafeMetadata: {
                    onboardingComplete: true,
                    role,
                    ...formData,
                },
            });

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
            await fetch(`${apiUrl}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clerkId: user.id,
                    role,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName,
                    ...formData,
                    about: formData.bio,
                    languages: ['English', 'Hindi']
                }),
            });

            toast.success("Profile Setup Complete!");
            router.push(`/${role}/dashboard`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
            <VibrantBackground />


            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
               className="w-full max-w-3xl space-y-12 py-20 relative z-10"
            >

                <div className="text-center space-y-6">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center mb-8"
                    >
                       <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
                          <img src="/logo.png" className="w-12 h-12 object-contain" alt="Logo" />
                       </div>
                    </motion.div>
                    <h1 className="text-6xl font-black logo-text tracking-tighter">
                        Profile Setup
                    </h1>
                    <p className="text-lg font-bold text-slate-400">
                        Complete your medical profile to get started
                    </p>
                </div>


                <div className="bg-white/80 backdrop-blur-3xl border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-12 relative overflow-hidden w-full max-w-4xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16 border-b border-slate-50 pb-10">
                        <div className="space-y-2 text-center sm:text-left">
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Select your role</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Establish Your Identity</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 px-8 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest border border-rose-100"
                            onClick={() => window.location.reload()}
                        >
                            <X className="w-4 h-4 mr-2" /> Reset selection
                        </Button>
                    </div>


                    <CardContent className="p-0 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { 
                                    id: "patient", 
                                    label: "Patient", 
                                    sub: "I seek care", 
                                    icon: UserRound, 
                                    color: "from-blue-500/20 to-indigo-600/20",
                                    iconColor: "text-blue-400"
                                },
                                { 
                                    id: "doctor", 
                                    label: "Doctor", 
                                    sub: "I provide care", 
                                    icon: Stethoscope, 
                                    color: "from-emerald-500/20 to-teal-600/20",
                                    iconColor: "text-emerald-400"
                                }
                            ].map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleRoleSelect(item.id as any)}
                                    className={cn(
                                        "group cursor-pointer rounded-[2.5rem] border-2 p-10 transition-all duration-300 relative overflow-hidden",
                                        role === item.id
                                            ? "border-primary bg-primary/5 shadow-3xl shadow-primary/10"
                                            : "border-slate-50 bg-slate-50 hover:border-primary/20 hover:bg-white"
                                    )}

                                >
                                    <div className={cn(
                                       "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                                       item.color
                                    )} />
                                    
                                    <div className="flex flex-col items-center justify-center space-y-8 relative z-10 text-center">
                                        <div className={cn(
                                            "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-xl border border-white",
                                            role === item.id ? "bg-primary text-white scale-110" : "bg-white text-slate-300"
                                        )}>

                                            <item.icon className="w-12 h-12" />
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-3xl font-black tracking-tight",
                                                role === item.id ? "text-slate-900" : "text-slate-400"
                                            )}>{item.label}</h3>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{item.sub}</p>
                                        </div>
                                    </div>
                                </motion.div>

                            ))}
                        </div>

                        <AnimatePresence>
                        {role && (
                            <motion.form 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSubmit} 
                                className="space-y-10 pt-10 border-t border-white/5"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</Label>
                                        <Input
                                            name="phone"
                                            placeholder="+91 XXXXX XXXXX"
                                            required
                                            className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 focus:border-primary text-slate-900 transition-all shadow-inner"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Age</Label>
                                        <Input
                                            name="age"
                                            type="number"
                                            placeholder="Enter Age"
                                            required
                                            className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 focus:border-primary text-slate-900 transition-all"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gender</Label>
                                    <Select onValueChange={(val) => handleSelectChange("gender", val)} required>
                                        <SelectTrigger className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 focus:border-primary text-slate-900 transition-all">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 bg-white shadow-2xl overflow-hidden">
                                            <SelectItem value="male" className="font-black py-4">Male</SelectItem>
                                            <SelectItem value="female" className="font-black py-4">Female</SelectItem>
                                            <SelectItem value="other" className="font-black py-4">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {role === "patient" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Blood Group</Label>
                                            <Select onValueChange={(val) => handleSelectChange("bloodGroup", val)} required>
                                                <SelectTrigger className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900">
                                                    <SelectValue placeholder="Group" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-100">
                                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                        <SelectItem key={bg} value={bg} className="font-black py-3">{bg}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Weight (kg)</Label>
                                            <Input
                                                name="weight"
                                                type="number"
                                                placeholder="e.g. 70"
                                                className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Height (cm)</Label>
                                            <Input
                                                name="height"
                                                type="number"
                                                placeholder="e.g. 170"
                                                className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900"
                                                value={formData.height}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Emergency Contact</Label>
                                            <Input
                                                name="emergencyContact"
                                                placeholder="+91 XXXXX XXXXX"
                                                className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900"
                                                value={formData.emergencyContact}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Allergies</Label>
                                            <Input
                                                name="allergies"
                                                placeholder="Any allergies? (e.g. Penicillin, Peanuts)"
                                                className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900"
                                                value={formData.allergies}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Medications</Label>
                                            <Input
                                                name="currentMedications"
                                                placeholder="Any existing medications?"
                                                className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 text-slate-900"
                                                value={formData.currentMedications}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                )}


                                {role === "doctor" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Medical Specialization</Label>
                                            <Select onValueChange={(val) => handleSelectChange("specialization", val)} required>
                                                <SelectTrigger className="h-16 px-8 text-lg font-black rounded-2xl bg-slate-50 border-slate-100 focus:border-primary text-slate-900 transition-all">
                                                    <SelectValue placeholder="Select Specialization" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 bg-white shadow-2xl max-h-[300px]">
                                                    {MEDICAL_SPECIALIZATIONS.map((spec) => (
                                                        <SelectItem key={spec.id} value={spec.name} className="font-black py-4">
                                                            {spec.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-50/50 p-10 rounded-[2.5rem] border border-blue-100 relative overflow-hidden group shadow-inner">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                               <ShieldCheck className="w-20 h-20 text-blue-600" />
                                            </div>
                                            <div className="col-span-full mb-4">
                                                <h4 className="text-sm font-black text-blue-600 flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    Professional Verification
                                                </h4>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Medical Council</Label>
                                                <Select onValueChange={(val) => handleSelectChange("medicalCouncil", val)} required disabled={isVerified}>
                                                    <SelectTrigger className="h-14 px-6 font-black rounded-xl bg-white border-slate-100 text-slate-900">
                                                        <SelectValue placeholder="Select Council" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-slate-100 font-bold">
                                                        <SelectItem value="Delhi Medical Council">Delhi Medical Council</SelectItem>
                                                        <SelectItem value="Maharashtra Medical Council">Maharashtra Medical Council</SelectItem>
                                                        <SelectItem value="Other State Council">Other State Council</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">License ID</Label>
                                                <div className="flex gap-3">
                                                    <Input
                                                        id="licenseNumber"
                                                        name="licenseNumber"
                                                        placeholder="NMC-XXXX"
                                                        required
                                                        disabled={isVerified}
                                                        className="h-14 bg-white border-slate-100 rounded-xl text-slate-900 font-black px-6"
                                                        value={formData.licenseNumber}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        onClick={handleVerifyLicense}
                                                        disabled={isVerified || isVerifying}
                                                        className={cn(
                                                            "h-14 px-6 font-black uppercase rounded-xl transition-all shadow-xl shrink-0",
                                                            isVerified ? "bg-emerald-500 text-white" : "bg-primary text-white hover:bg-primary/80"
                                                        )}
                                                    >
                                                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                                                        isVerified ? <CheckCircle2 className="w-5 h-5" /> : "Verify"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    className="glowing-button w-full h-24 text-3xl font-black rounded-[2.5rem] mt-12 flex items-center justify-center group"
                                    disabled={isSubmitting || (role === 'doctor' && !isVerified)}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-6">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                            <span>Saving Profile...</span>
                                        </div>
                                    ) : (
                                        <>
                                           Complete Onboarding
                                           <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </motion.form>
                        )}
                        </AnimatePresence>
                    </CardContent>
                </div>
            </motion.div>
            
            <div className="text-center text-[10px] text-slate-200 font-black py-10 uppercase tracking-[0.5em] relative z-10">
                SwasthGuru &bull; 2026
            </div>

        </div>
    );
}


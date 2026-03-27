"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRound, Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MEDICAL_SPECIALIZATIONS } from "@/lib/specializations";
import { cn } from "@/lib/utils";


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
        specialization: "",
        experience: "",
        licenseNumber: "",
        qualifications: "",
        consultationFee: "",
        bio: "",
        address: "",
        bloodGroup: "",
        height: "",
        weight: "",
        allergies: "",
        currentMedications: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            // Sync with backend
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerkId: user.id,
                    role,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName,
                    ...formData,
                    about: formData.bio, // Map bio to 'about' field in schema
                    languages: ['English', 'Hindi'] // Default languages or add input for it
                }),
            });

            if (!response.ok) {
                console.warn("Backend sync failed, but metadata updated.");
            }

            toast.success("Profile Setup Complete!");
            router.push(`/${role}/dashboard`);
        } catch (error) {
            console.error("Error updating user metadata:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground relative overflow-hidden">
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-2xl space-y-8 py-10 relative z-10">
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-primary">
                        नमस्ते (Welcome)
                    </h1>
                    <p className="text-base font-bold text-muted-foreground italic">
                        Let's set up your profile to get started
                    </p>
                </div>

                <Card className="border shadow-xl rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="p-6 border-b flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">आपका विवरण (Your Details)</CardTitle>
                            <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                Choose your role to continue
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            onClick={async () => {
                                if (confirm("This will clear your local data and reset onboarding. Continue?")) {
                                    localStorage.clear();
                                    try {
                                        await user?.update({
                                            unsafeMetadata: {}
                                        });
                                        window.location.reload();
                                    } catch (err) {
                                        toast.error("Failed to reset. You can still proceed.");
                                        window.location.reload();
                                    }
                                }
                            }}
                        >
                            RESET & START FRESH
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                onClick={() => handleRoleSelect("patient")}
                                className={cn(
                                    "group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300",
                                    role === "patient"
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                        : "border-muted bg-muted/20 hover:border-primary/20"
                                )}
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-all duration-300",
                                        role === "patient" ? "bg-primary text-black" : "bg-card text-muted-foreground shadow-sm"
                                    )}>
                                        <UserRound className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className={cn(
                                            "text-lg font-bold",
                                            role === "patient" ? "text-primary" : "text-foreground"
                                        )}>रोगी (Patient)</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">I need medical care</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => handleRoleSelect("doctor")}
                                className={cn(
                                    "group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300",
                                    role === "doctor"
                                        ? "border-secondary bg-secondary/5 shadow-lg shadow-secondary/10"
                                        : "border-muted bg-muted/20 hover:border-secondary/20"
                                )}
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-all duration-300",
                                        role === "doctor" ? "bg-secondary text-white" : "bg-card text-muted-foreground shadow-sm"
                                    )}>
                                        <Stethoscope className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className={cn(
                                            "text-lg font-bold",
                                            role === "doctor" ? "text-secondary" : "text-foreground"
                                        )}>डॉक्टर (Doctor)</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">I provide medical care</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {role && (
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">फ़ोन नंबर (Phone Number)</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+91 9876543210"
                                                required
                                                className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="age" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">आयु (Age)</Label>
                                            <Input
                                                id="age"
                                                name="age"
                                                type="number"
                                                min="0"
                                                placeholder="Enter Age"
                                                required
                                                className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                onKeyDown={preventNegative}
                                                value={formData.age}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">लिंग (Gender)</Label>
                                        <Select onValueChange={(val) => handleSelectChange("gender", val)} required>
                                            <SelectTrigger className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all">
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border shadow-xl">
                                                <SelectItem value="male" className="text-sm font-bold py-2">Male</SelectItem>
                                                <SelectItem value="female" className="text-sm font-bold py-2">Female</SelectItem>
                                                <SelectItem value="other" className="text-sm font-bold py-2">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {role === "patient" && (
                                        <div className="space-y-6 pt-4 animate-in fade-in duration-500">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">पता (Address)</Label>
                                                <Input
                                                    id="address"
                                                    name="address"
                                                    placeholder="Enter your full address"
                                                    required
                                                    className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">ब्लड ग्रुप (Blood Group)</Label>
                                                    <Select onValueChange={(val) => handleSelectChange("bloodGroup", val)}>
                                                        <SelectTrigger className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border shadow-xl">
                                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(v => (
                                                                <SelectItem key={v} value={v} className="text-sm font-bold py-2">{v}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="height" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">ऊंचाई (Height cm)</Label>
                                                    <Input
                                                        id="height"
                                                        name="height"
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 170"
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        onKeyDown={preventNegative}
                                                        value={formData.height}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="weight" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">वजन (Weight kg)</Label>
                                                    <Input
                                                        id="weight"
                                                        name="weight"
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 70"
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        onKeyDown={preventNegative}
                                                        value={formData.weight}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="allergies" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">एलर्जी (Allergies)</Label>
                                                <Input
                                                    id="allergies"
                                                    name="allergies"
                                                    placeholder="Any allergies (e.g. Penicillin, Peanuts) or 'None'"
                                                    className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                    value={formData.allergies}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="currentMedications" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">दवाइयाँ (Current Medications)</Label>
                                                <Input
                                                    id="currentMedications"
                                                    name="currentMedications"
                                                    placeholder="Medications you take daily or 'None'"
                                                    className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                    value={formData.currentMedications}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {role === "doctor" && (
                                        <div className="space-y-6 pt-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="specialization" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">विशेषज्ञता (Specialization)</Label>
                                                <Select onValueChange={(val) => handleSelectChange("specialization", val)} required>
                                                    <SelectTrigger className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all">
                                                        <SelectValue placeholder="Select Specialization" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border shadow-xl max-h-[250px]">
                                                        {MEDICAL_SPECIALIZATIONS.map((spec) => (
                                                            <SelectItem key={spec.id} value={spec.name} className="text-sm font-bold py-2">
                                                                {spec.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="experience" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">अनुभव (Experience Yrs)</Label>
                                                    <Input
                                                        id="experience"
                                                        name="experience"
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 5"
                                                        required
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        onKeyDown={preventNegative}
                                                        value={formData.experience}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="consultationFee" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">परामर्श शुल्क (Fee ₹)</Label>
                                                    <Input
                                                        id="consultationFee"
                                                        name="consultationFee"
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 500"
                                                        required
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        onKeyDown={preventNegative}
                                                        value={formData.consultationFee}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="qualifications" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">योग्यता (Qualifications)</Label>
                                                    <Input
                                                        id="qualifications"
                                                        name="qualifications"
                                                        placeholder="e.g. MBBS, MD"
                                                        required
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        value={formData.qualifications}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="licenseNumber" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">लाइसेंस नंबर (License No.)</Label>
                                                    <Input
                                                        id="licenseNumber"
                                                        name="licenseNumber"
                                                        placeholder="Medical License No."
                                                        required
                                                        className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                        value={formData.licenseNumber}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="bio" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">मेरे बारे में (About You)</Label>
                                                <Input
                                                    id="bio"
                                                    name="bio"
                                                    placeholder="Brief description about your practice..."
                                                    required
                                                    className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                    value={formData.bio}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">पता (Clinic Address)</Label>
                                                <Input
                                                    id="address"
                                                    name="address"
                                                    placeholder="Clinic or Hospital Address"
                                                    className="h-11 px-4 text-sm font-bold rounded-xl bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="premium"
                                    className="w-full h-14 text-xl font-bold rounded-2xl mt-6 text-black"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span>प्रोफ़ाइल बना रहे हैं...</span>
                                        </div>
                                    ) : (
                                        "आगे बढ़ें (Complete Setup)"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

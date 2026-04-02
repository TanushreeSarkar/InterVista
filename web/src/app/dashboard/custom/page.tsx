"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Sparkles } from "lucide-react";
import { createSession } from "@/lib/api";

export default function CustomInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState("");
    const [company, setCompany] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [resumeText, setResumeText] = useState("");

    const handleStart = async () => {
        if (!role || !company) return;

        try {
            setLoading(true);
            const { session } = await createSession({
                role,
                company,
                difficulty,
            });

            router.push(`/interview/${session.id}`);
        } catch (error) {
            console.error("Failed to start session:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-offwhite">
            <Sidebar />
            <div className="lg:pl-64 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Custom Interview</h1>
                    <p className="text-gray-500 mb-8">Generate a personalized interview based on your resume and target role.</p>

                    <div className="max-w-3xl mx-auto">
                        <Card className="border-none shadow-md">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl p-6">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Sparkles className="w-6 h-6" /> Resume Analysis
                                </CardTitle>
                                <CardDescription className="text-blue-100">
                                    Paste your resume text below. Our AI will analyze your skills and experience to ask relevant questions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Target Role</Label>
                                        <Input
                                            id="role"
                                            placeholder="e.g. Senior Java Developer"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Target Company</Label>
                                        <Input
                                            id="company"
                                            placeholder="e.g. Google, Amazon"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="difficulty">Difficulty</Label>
                                        <select
                                            id="difficulty"
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resume">Resume Content (optional)</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Textarea
                                            id="resume"
                                            placeholder="Paste your resume text here..."
                                            className="min-h-[200px] pl-10 font-mono text-sm"
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">
                                        {resumeText.length} characters
                                    </p>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg bg-coral hover:bg-orange-600 text-white"
                                    onClick={handleStart}
                                    disabled={loading || !role || !company}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Analyzing Resume...
                                        </>
                                    ) : (
                                        "Start Personalized Interview"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

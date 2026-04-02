"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="min-h-screen bg-offwhite">
            <Sidebar />
            <div className="lg:pl-64 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Billing & Plans</h1>
                    <p className="text-gray-500 mb-8">Manage your subscription and billing details.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Free Trial</CardTitle>
                                <CardDescription>Perfect for getting started</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-gray-500">/mo</span></div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> 3 Practice Interviews</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Basic AI Feedback</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Standard Roles</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                            </CardFooter>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="border-2 border-primary shadow-lg scale-105 relative">
                            <div className="absolute top-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded-bl-lg font-bold">POPULAR</div>
                            <CardHeader>
                                <CardTitle className="text-xl">Pro</CardTitle>
                                <CardDescription>For serious job seekers</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">$19<span className="text-sm font-normal text-gray-500">/mo</span></div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Unlimited Interviews</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Advanced Resume Analysis</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Detailed Performance Reports</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Custom Questions</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Upgrade to Pro</Button>
                            </CardFooter>
                        </Card>

                        {/* Enterprise */}
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Expert</CardTitle>
                                <CardDescription>Live coaching & more</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">$99<span className="text-sm font-normal text-gray-500">/mo</span></div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> All Pro Features</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> 1-on-1 Human Coaching</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Mock Live Interviews</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Contact Sales</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

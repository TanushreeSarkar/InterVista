"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessions, type InterviewSession } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getSessions();
                setSessions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen bg-offwhite">
            <Sidebar />
            <div className="lg:pl-64 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Interview Results</h1>

                    <div className="space-y-4">
                        {loading ? (
                            <p>Loading...</p>
                        ) : sessions.length === 0 ? (
                            <p>No interviews yet.</p>
                        ) : (
                            sessions.map((session) => (
                                <Card key={session.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg">{session.role} at {session.company}</h3>
                                                <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                                    {session.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(session.createdAt).toLocaleDateString()} • {session.difficulty}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <Button asChild variant="outline">
                                                <Link href={session.status === 'completed' ? `/evaluation/${session.id}` : `/interview/${session.id}`}>
                                                    {session.status === 'completed' ? 'View Results' : 'Continue'}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

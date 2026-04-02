"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Briefcase, Calendar, Edit2, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import * as api from "@/lib/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    targetRole: "",
    targetCompany: "",
    createdAt: "",
  });

  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileData, analyticsData] = await Promise.all([
          api.getProfile(),
          api.getAnalyticsOverview().catch(() => null),
        ]);

        setProfile({
          name: profileData.name || "",
          email: profileData.email || "",
          bio: profileData.bio || "",
          targetRole: profileData.targetRole || "",
          targetCompany: profileData.targetCompany || "",
          createdAt: profileData.createdAt
            ? new Date(profileData.createdAt).toLocaleDateString()
            : "",
        });

        if (analyticsData) {
          setStats({
            totalSessions: analyticsData.totalSessions,
            averageScore: analyticsData.averageScore,
            completedSessions: analyticsData.completedSessions,
          });
        }
      } catch {
        // If profile fails, use auth context user as fallback
        if (user) {
          setProfile((prev) => ({
            ...prev,
            name: user.name,
            email: user.email,
          }));
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        name: profile.name,
        bio: profile.bio,
        targetRole: profile.targetRole,
        targetCompany: profile.targetCompany,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-background">
      <EnhancedNavbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-8">Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-secondary text-white">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-2">{profile.name || "Loading..."}</h2>
                  <p className="text-muted-foreground mb-4">{profile.targetRole || "Set your target role"}</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</>
                    ) : isEditing ? (
                      <><Save className="w-4 h-4 mr-2" /> Save</>
                    ) : (
                      <><Edit2 className="w-4 h-4 mr-2" /> Edit</>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetRole">Target Role</Label>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="targetRole"
                        value={profile.targetRole}
                        onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input value={profile.createdAt || "—"} disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Interview Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{stats.totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{stats.averageScore}</div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{stats.completedSessions}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
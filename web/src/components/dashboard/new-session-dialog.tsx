"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createSession } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: (sessionId: string) => void;
  initialRole?: string;
  initialDifficulty?: string;
  initialPersonaId?: string;
}

const roles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "DevOps Engineer",
  "Marketing Manager",
  "Sales Representative",
  "Business Analyst",
];

const difficulties = ["Easy", "Medium", "Hard"];

export function NewSessionDialog({
  open,
  onOpenChange,
  onSessionCreated,
  initialRole = "",
  initialDifficulty = "",
  initialPersonaId = "",
}: NewSessionDialogProps) {
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!role || !company || !difficulty) return;

    try {
      setLoading(true);
      setError("");
      const { session } = await createSession({ role, company, difficulty, personaId: initialPersonaId || undefined });
      onOpenChange(false);
      onSessionCreated?.(session.id);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create session");
      console.error("Failed to create session:", error);
    } finally {
      setLoading(false);
    }
  }

  // Effect to update internal state when dialog opens with new props
  useEffect(() => {
    if (open) {
      setRole(initialRole);
      setDifficulty(initialDifficulty);
      setCompany("");
      setError("");
      setShowRoleSuggestions(false);
    }
  }, [open, initialRole, initialDifficulty]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Interview</DialogTitle>
          <DialogDescription>
            Choose your target role, company, and difficulty level to begin your
            practice session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setShowRoleSuggestions(true);
              }}
              onFocus={() => setShowRoleSuggestions(true)}
              onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
              placeholder="e.g. Software Engineer"
            />
            {showRoleSuggestions && (
              <div className="absolute z-50 w-full bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                {roles
                  .filter((r) => r.toLowerCase().includes(role.toLowerCase()))
                  .map((r) => (
                    <div
                      key={r}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1E1E2E] text-gray-900 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] cursor-pointer text-sm transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRole(r);
                        setShowRoleSuggestions(false);
                      }}
                    >
                      {r}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g. Google, Amazon, Meta..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!role || !company || !difficulty || loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
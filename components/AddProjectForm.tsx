'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWebsite } from "@/app/actions"; // Server Action
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export default function AddProjectForm() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Stop default reload
        setLoading(true);
        
        const formData = new FormData(event.currentTarget);
        
        try {
            await addWebsite(formData);
            toast.success("Project added successfully!");
            (event.target as HTMLFormElement).reset(); // Clear form
        } catch (error) {
            toast.error("Failed to add project. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input name="name" placeholder="e.g. My Portfolio" required disabled={loading} />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Base URL</label>
                <Input name="url" placeholder="https://example.com" required disabled={loading} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Start Monitoring</>
                )}
            </Button>
        </form>
    );
}
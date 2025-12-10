'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPage } from "@/app/actions"; 
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export default function AddPageForm({ websiteId }: { websiteId: number }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        
        const formData = new FormData(event.currentTarget);
        
        try {
            // We need to pass websiteId. Since server action expects it as argument, 
            // we can bind it or pass it directly if we refactor actions. 
            // The easiest way with your current action structure:
            await addPage(websiteId, formData); 
            toast.success("Page added to monitoring!");
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            toast.error("Failed to add page.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Page Path</label>
                <Input name="path" placeholder="/about" required disabled={loading} />
                <p className="text-xs text-muted-foreground">Relative to domain (e.g. /contact)</p>
            </div>
            <Button type="submit" disabled={loading}>
                 {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Start Monitoring</>
                )}
            </Button>
        </form>
    );
}
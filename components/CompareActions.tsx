'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveChanges } from "@/app/actions"; 
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

interface CompareActionsProps {
    pageId: number;
    websiteId: number;
}

export default function CompareActions({ pageId, websiteId }: CompareActionsProps) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isIgnoring, setIsIgnoring] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false); // New State
    const router = useRouter();

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await approveChanges(pageId);
            toast.success("Changes Approved! Baseline updated.");
            setIsCompleted(true); // Hide buttons
            router.refresh(); // Refresh data
        } catch (error) {
            toast.error("Failed to approve changes.");
            setIsAccepting(false);
        }
    };

    const handleIgnore = () => {
        setIsIgnoring(true);
        setTimeout(() => {
            toast.info("Changes ignored.");
            setIsCompleted(true); // Hide buttons
            setIsIgnoring(false);
        }, 500);
    };

    // If action is done, hide everything (or show a small "Done" badge)
    if (isCompleted) {
        return <div className="text-sm font-medium text-muted-foreground">Action Completed</div>;
    }

    return (
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={handleIgnore}
                disabled={isIgnoring || isAccepting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
                {isIgnoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                Ignore
            </Button>
            
            <Button 
                onClick={handleAccept}
                disabled={isIgnoring || isAccepting}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Accept Change
            </Button>
        </div>
    );
}
'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { checkPage } from "@/app/actions"; 

interface CheckButtonProps {
  pageId: number;
  url: string;
}

export default function CheckButton({ pageId, url }: CheckButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!url) {
      alert("Error: URL is missing");
      return;
    }

    setLoading(true);
    try {
      await checkPage(pageId, url);
    } catch (error) {
      console.error("Check failed:", error);
      alert("Failed to check page. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="default" 
      onClick={handleCheck} 
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <Play className="mr-2 h-3 w-3" />
          Check Now
        </>
      )}
    </Button>
  );
}
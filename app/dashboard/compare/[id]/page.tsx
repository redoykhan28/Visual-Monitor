import { db } from '@/db';
import { pages, snapshots, websites } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Toaster } from "sonner"; // Notification Provider

import DiffViewer from '@/components/DiffViewer';
import CompareActions from '@/components/CompareActions'; // New Client Component

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ComparePage({ params }: Props) {
    const resolvedParams = await params;
    const pageId = parseInt(resolvedParams.id);
    if (isNaN(pageId)) return notFound();

    const pageData = await db.query.pages.findFirst({
        where: eq(pages.id, pageId),
        with: {
            snapshots: {
                orderBy: [desc(snapshots.createdAt)],
                limit: 1
            }
        }
    });

    if (!pageData || !pageData.websiteId) return notFound();

    const websiteData = await db.query.websites.findFirst({
        where: eq(websites.id, pageData.websiteId)
    });

    if (!websiteData) return notFound();

    const latestSnapshot = pageData.snapshots[0];
    const baselineImage = pageData.baselineUrl;
    
    // Logic: If we have a snapshot, use it. If not, fallback to baseline.
    const newImage = latestSnapshot?.imageUrl || baselineImage;
    const diffOverlay = latestSnapshot?.diffUrl; // Get the Yellow Overlay

    if (!baselineImage) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                 <h1 className="text-2xl font-bold mb-2">No Comparison Available</h1>
                 <p className="text-muted-foreground mb-6">Take a snapshot to set the baseline.</p>
                 <Link href={`/dashboard/${pageData.websiteId}`}>
                    <Button cursor-pointer>Back to Project</Button>
                 </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Toaster position="top-center" /> {/* Toast Container */}
            <Navbar />
            
            <div className="border-b bg-card p-4 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/${pageData.websiteId}`}>
                            <Button variant="ghost" size="sm" className="cursor-pointer">
                                <ArrowLeft size={16} className="mr-2"/> Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-bold text-lg flex items-center gap-2">
                                {pageData.path}
                                {pageData.status === 'changed' && <Badge variant="destructive">Changes Detected</Badge>}
                                {pageData.status === 'clean' && <Badge variant="outline" className="text-green-600 border-green-200">Clean</Badge>}
                            </h1>
                            <p className="text-xs text-muted-foreground">{websiteData.url}</p>
                        </div>
                    </div>
                    
                    {/* Using the new Interactive Client Component */}
                    <CompareActions pageId={pageId} websiteId={pageData.websiteId} />
                </div>
            </div>

            <main className="flex-1 p-6 bg-slate-50 dark:bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    
                    <Tabs defaultValue="slider" className="w-full flex flex-col">
                        <div className="flex justify-center mb-6 sticky top-20 z-40">
                            <TabsList className="bg-white/50 backdrop-blur shadow-sm">
                                <TabsTrigger value="slider" className="cursor-pointer">Slider Comparison</TabsTrigger>
                                <TabsTrigger value="side-by-side" className="cursor-pointer">Side by Side</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="slider" className="mt-0">
                            <Card className="overflow-hidden border shadow-sm bg-checkerboard">
                                <DiffViewer 
                                    baseline={baselineImage} 
                                    current={newImage!} 
                                    diffOverlay={diffOverlay} 
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="side-by-side" className="mt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="font-semibold text-center text-muted-foreground uppercase text-xs">Original</div>
                                    <Card className="overflow-hidden border-2 border-dashed bg-checkerboard">
                                        <img src={baselineImage} alt="Baseline" className="w-full h-auto" />
                                    </Card>
                                </div>
                                <div className="flex flex-col gap-2">
                                     <div className="font-semibold text-center text-blue-600 uppercase text-xs">New Version</div>
                                    <Card className="overflow-hidden border-2 border-blue-200 bg-checkerboard relative">
                                        <img src={newImage!} alt="New Version" className="w-full h-auto" />
                                        {/* Simple overlay if diff exists in side-by-side too */}
                                        {diffOverlay && (
                                            <img src={diffOverlay} className="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none mix-blend-multiply" />
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
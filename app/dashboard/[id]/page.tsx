import { db } from '@/db';
import { websites, pages, snapshots } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";

import CheckButton from '@/components/CheckButton';
import AddPageForm from '@/components/AddPageForm';
import ItemActions from '@/components/ItemActions';
import PaginationControls from '@/components/PaginationControls';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WebsiteDetails({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const websiteId = parseInt(resolvedParams.id);
    if (isNaN(websiteId)) return notFound();

    // 1. Pagination Logic
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams['page'] ?? '1';
    const limit = 10;
    const offset = (Number(page) - 1) * limit;

    const website = await db.query.websites.findFirst({
        where: eq(websites.id, websiteId)
    });

    if (!website) return notFound();

    // 2. Fetch Pages (Paginated)
    const sitePages = await db.query.pages.findMany({
        where: eq(pages.websiteId, websiteId),
        limit: limit,
        offset: offset,
        with: {
            snapshots: {
                orderBy: [desc(snapshots.createdAt)],
                limit: 1
            }
        }
    });

    const hasNextPage = sitePages.length === limit;
    const hasPrevPage = offset > 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-6xl mx-auto p-8">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm text-muted-foreground flex items-center gap-2 hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{website.name}</h1>
                            <a href={website.url} target="_blank" className="text-muted-foreground flex items-center gap-1 mt-1 hover:underline text-sm">
                                {website.url} <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Monitored Pages</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Path</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sitePages.map((page) => {
                                            let statusBadge;
                                            if (page.status === 'clean') statusBadge = <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Clean</Badge>;
                                            else if (page.status === 'changed') statusBadge = <Badge variant="destructive">Change Detected</Badge>;
                                            else statusBadge = <Badge variant="secondary">New / Pending</Badge>;

                                            return (
                                                <TableRow key={page.id}>
                                                    <TableCell className="font-medium font-mono text-sm">{page.path}</TableCell>
                                                    <TableCell>
                                                        {statusBadge}
                                                        {page.status === 'changed' && page.lastDiffPercent && (
                                                            <span className="text-xs text-muted-foreground ml-2">({page.lastDiffPercent.toFixed(2)}%)</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            {/* Check Button */}
                                                            <CheckButton pageId={page.id} url={`${website.url}${page.path}`} />
                                                            
                                                            {/* Review Button */}
                                                            {page.baselineUrl && (
                                                                <Link href={`/dashboard/compare/${page.id}`} target="_blank">
                                                                    <Button size="sm" variant="outline" className="gap-2"><Eye size={14} /> Review</Button>
                                                                </Link>
                                                            )}

                                                            {/* Edit/Delete Dropdown */}
                                                            <ItemActions id={page.id} type="page" currentName={page.path} />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {sitePages.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No pages monitored yet. Add one via the form.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination Controls */}
                                {sitePages.length > 0 && (
                                    <PaginationControls 
                                        hasNextPage={hasNextPage} 
                                        hasPrevPage={hasPrevPage} 
                                        itemCount={sitePages.length} 
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader><CardTitle>Add Page to Monitor</CardTitle></CardHeader>
                            <CardContent>
                                <AddPageForm websiteId={websiteId} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
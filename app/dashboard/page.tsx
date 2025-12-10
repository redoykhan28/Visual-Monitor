import { db } from '@/db';
import { websites } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import Link from 'next/link';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Globe, Layers } from "lucide-react";

import AddProjectForm from '@/components/AddProjectForm';
import ItemActions from '@/components/ItemActions';
import PaginationControls from '@/components/PaginationControls';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser();
  if (!user) redirect('/');

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams['page'] ?? '1';
  const limit = 10;
  const offset = (Number(page) - 1) * limit;

  const userWebsites = await db.query.websites.findMany({
    where: eq(websites.userId, user.id),
    with: { pages: true },
    limit: limit,
    offset: offset,
    orderBy: [desc(websites.id)], 
  });

  const hasNextPage = userWebsites.length === limit;
  const hasPrevPage = offset > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your visual testing projects.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: Project List */}
          <div className="md:col-span-2 space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader><CardTitle>Your Projects</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {userWebsites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    No projects yet. Add one on the right.
                  </div>
                ) : (
                  <>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {userWebsites.map((site) => (
                        <AccordionItem 
                            key={site.id} 
                            value={`site-${site.id}`} 
                            className="border rounded-lg px-2 data-[state=open]:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center w-full py-2">
                                {/* Trigger Area: Uses Grid to keep things aligned */}
                                <AccordionTrigger className="hover:no-underline flex-1 py-0 pr-4">
                                    <div className="grid grid-cols-12 gap-4 items-center w-full text-left">
                                        
                                        {/* Name (Col 1-4) */}
                                        <div className="col-span-12 sm:col-span-4 font-semibold text-lg truncate flex items-center gap-2">
                                            <Globe size={16} className="text-blue-500 shrink-0"/>
                                            <span className="truncate">{site.name}</span>
                                        </div>

                                        {/* URL (Col 5-9) */}
                                        <div className="col-span-12 sm:col-span-5 text-sm text-muted-foreground truncate hidden sm:block">
                                            {site.url}
                                        </div>

                                        {/* Badge (Col 10-12) */}
                                        <div className="col-span-12 sm:col-span-3 flex justify-end">
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Layers size={12} />
                                                {site.pages.length} Pages
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                
                                {/* 3-Dots Menu (Fixed Width) */}
                                <div className="shrink-0 ml-2 border-l pl-2">
                                    <ItemActions id={site.id} type="project" currentName={site.name} />
                                </div>
                            </div>

                            <AccordionContent className="pt-0 pb-4 px-2">
                                <div className="mt-2 border rounded-md bg-background overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Path</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {site.pages.map((page) => (
                                            <TableRow key={page.id}>
                                            <TableCell className="font-medium font-mono">{page.path}</TableCell>
                                            <TableCell>
                                                {page.status === 'clean' && <Badge variant="outline" className="text-green-600 border-green-200">Clean</Badge>}
                                                {page.status === 'changed' && <Badge variant="destructive">Changed</Badge>}
                                                {page.status === 'new' && <Badge variant="secondary">New</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/${site.id}`}>
                                                <Button size="sm" variant="ghost" className="gap-2 h-8">Details <ArrowRight size={14} /></Button>
                                                </Link>
                                            </TableCell>
                                            </TableRow>
                                        ))}
                                        {site.pages.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">No pages monitored yet.</TableCell></TableRow>
                                        )}
                                        </TableBody>
                                    </Table>
                                    <div className="p-2 border-t bg-muted/10">
                                        <Link href={`/dashboard/${site.id}`}>
                                            <Button variant="outline" size="sm" className="w-full h-8 text-xs">Manage & Add Pages</Button>
                                        </Link>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="mt-auto">
                        <PaginationControls 
                            hasNextPage={hasNextPage} 
                            hasPrevPage={hasPrevPage} 
                            itemCount={userWebsites.length} 
                        />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Add Form */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Add New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <AddProjectForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { NavbarSkeleton } from "@/components/Navbar";

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton />
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="border rounded-lg p-6 bg-card">
                <Skeleton className="h-7 w-32 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
             </div>
          </div>
          <div>
            <div className="border rounded-lg p-6 bg-card">
                <Skeleton className="h-7 w-40 mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
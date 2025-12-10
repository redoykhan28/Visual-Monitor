import { Skeleton } from "@/components/ui/skeleton";
import { NavbarSkeleton } from "@/components/Navbar";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton />
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="md:col-span-2 space-y-6">
             <div className="border rounded-lg p-6 bg-card">
                <Skeleton className="h-7 w-32 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                </div>
             </div>
          </div>
          {/* Right Column Skeleton */}
          <div>
            <div className="border rounded-lg p-6 bg-card">
                <Skeleton className="h-7 w-32 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
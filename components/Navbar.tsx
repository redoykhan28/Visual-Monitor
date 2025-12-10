import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Make sure to import Skeleton

export default function Navbar() {
  return (
    <nav className="border-b bg-card text-card-foreground">
      <div className="flex h-16 items-center px-4 max-w-6xl mx-auto container">
        {/* Logo Area */}
        <div className="flex items-center gap-2 font-bold text-xl mr-auto">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg">
            <LayoutDashboard size={20} />
          </div>
          <span>VisualMonitor</span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}

// --- ADD THIS EXPORT SO LOADING.TSX CAN USE IT ---
export function NavbarSkeleton() {
  return (
    <nav className="border-b bg-card text-card-foreground">
      <div className="flex h-16 items-center px-4 max-w-6xl mx-auto container justify-between">
        <div className="flex items-center gap-2">
           <Skeleton className="h-8 w-8 rounded-lg" />
           <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-4">
           <Skeleton className="h-9 w-9 rounded-md" />
           <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </nav>
  );
}
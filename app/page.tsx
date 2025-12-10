import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const user = await currentUser();

  // If user is logged in, send them to dashboard immediately
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-primary text-primary-foreground rounded-lg font-bold">VM</div>
           <h1 className="font-bold text-xl">VisualMonitor</h1>
        </div>
        <SignInButton mode="modal">
          <Button variant="outline">Login</Button>
        </SignInButton>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-white to-gray-50 dark:from-background dark:to-muted/20">
        <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm">
           v1.0 Beta
        </Badge>
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-3xl">
           Automated <br/> 
           <span className="text-blue-600">Visual Regression</span> Testing.
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Don't let CSS bugs slip into production. We take screenshots of your site 
          and highlight the differences automatically.
        </p>
        <div className="flex gap-4">
           <SignInButton mode="modal">
             <Button size="lg" className="h-12 px-8 text-lg shadow-lg">Start Monitoring Free</Button>
           </SignInButton>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
         © 2024 VisualMonitor SaaS. All rights reserved.
      </footer>
    </div>
  );
}
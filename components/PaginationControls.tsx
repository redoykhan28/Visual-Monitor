'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemCount: number;
}

export default function PaginationControls({ hasNextPage, hasPrevPage, itemCount }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';
  const per_page = '10'; // Hardcoded for now, can be dynamic

  return (
    <div className="flex items-center justify-between border-t px-2 py-4 mt-4">
      <div className="text-sm text-muted-foreground">
        Showing page {page} ({itemCount} items)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => {
            router.push(`?page=${Number(page) - 1}&per_page=${per_page}`);
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => {
            router.push(`?page=${Number(page) + 1}&per_page=${per_page}`);
          }}
        >
          Next <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
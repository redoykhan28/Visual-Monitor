'use server'

import { db } from '@/db';
import { websites, pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 1. Add a New Website Project
export async function addWebsite(formData: FormData) {
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  // In a real app, get the userId from Clerk here: const { userId } = auth();
  const userId = "user_123"; 

  await db.insert(websites).values({
    userId,
    name,
    url,
  });

  revalidatePath('/'); // Refresh the dashboard
}

// 2. Add a Page to Monitor
export async function addPage(websiteId: number, formData: FormData) {
  const path = formData.get('path') as string;
  
  await db.insert(pages).values({
    websiteId,
    path,
  });

  revalidatePath(`/dashboard/${websiteId}`);
}
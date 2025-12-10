'use server'

import { db } from '@/db';
import { websites, pages, snapshots } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from "@clerk/nextjs/server";
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// ---------------------------------------------------------
// CRUD ACTIONS
// ---------------------------------------------------------

// 1. Add Website
export async function addWebsite(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const [newSite] = await db.insert(websites).values({ userId, name, url }).returning({ id: websites.id });
  await db.insert(pages).values({ websiteId: newSite.id, path: '/', status: 'clean' });
  revalidatePath('/dashboard');
}

// 2. Add Page
export async function addPage(websiteId: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const path = formData.get('path') as string;
  await db.insert(pages).values({ websiteId, path, status: 'clean' });
  revalidatePath(`/dashboard/${websiteId}`);
}

// 3. Delete Website
export async function deleteWebsite(websiteId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.delete(websites).where(eq(websites.id, websiteId));
  revalidatePath('/dashboard');
}

// 4. Delete Page
export async function deletePage(pageId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const pageData = await db.query.pages.findFirst({ where: eq(pages.id, pageId) });
  if (!pageData) return;
  await db.delete(pages).where(eq(pages.id, pageId));
  revalidatePath(`/dashboard/${pageData.websiteId}`);
}

// 5. Edit Website
export async function editWebsite(websiteId: number, newName: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.update(websites).set({ name: newName }).where(eq(websites.id, websiteId));
  revalidatePath('/dashboard');
}

// 6. Edit Page
export async function editPage(pageId: number, newPath: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const pageData = await db.query.pages.findFirst({ where: eq(pages.id, pageId) });
  if (!pageData) return;
  await db.update(pages).set({ path: newPath }).where(eq(pages.id, pageId));
  revalidatePath(`/dashboard/${pageData.websiteId}`);
}

// ---------------------------------------------------------
// 7. THE SMART CHECK (Instant Animation & Smart Scroll)
// ---------------------------------------------------------
export async function checkPage(pageId: number, rawUrl: string) {
  console.log("Raw Input URL:", rawUrl);

  // --- A. ROBUST URL CLEANING ---
  let targetUrl = rawUrl.trim();
  const lastHttp = targetUrl.lastIndexOf('http');
  if (lastHttp > 0) {
      targetUrl = targetUrl.substring(lastHttp);
  }
  if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
  }
  console.log("Navigating to Cleaned URL:", targetUrl);

  // --- B. HYBRID BROWSER LAUNCH ---
  let browser;
  let page;

  try {
    if (process.env.NODE_ENV === 'production') {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport as any, 
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as any, 
      });
    } else {
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    page = await browser.newPage();
    // Set HD Desktop Viewport
    await page.setViewport({ width: 1440, height: 1080 });

    // Navigate & Wait
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // --- C. OPTIMIZATION: DISABLE ANIMATIONS ---
    // This forces all fade-ins/slides to finish INSTANTLY. 
    // It prevents "cut off" content and speeds up the screenshot significantly.
    await page.addStyleTag({
        content: `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
            scroll-behavior: auto !important;
          }
        `
    });

    // --- D. SMART SCROLL (Faster now) ---
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = window.innerHeight; 
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 250); // Faster scroll (250ms) because animations are now instant
        });
    });

    // Short wait for lazy-loaded images (Network dependent, not animation dependent)
    await new Promise(r => setTimeout(r, 1000));

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));

    // --- E. FULL PAGE SCREENSHOT ---
    const screenshotBuffer = await page.screenshot({ 
      encoding: 'binary', 
      fullPage: true 
    }) as Buffer;
    
    await browser.close();

    const base64Image = `data:image/png;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;

    // --- F. COMPARISON LOGIC ---
    const existingPage = await db.query.pages.findFirst({ where: eq(pages.id, pageId) });
    if (!existingPage) return;

    let diffPercent = 0;
    let status = 'clean';
    let diffBase64: string | null = null;

    if (existingPage.baselineUrl) {
      try {
        const baselineBuffer = Buffer.from(existingPage.baselineUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const img1 = PNG.sync.read(baselineBuffer);
        const img2 = PNG.sync.read(screenshotBuffer);
        
        const { width, height } = img1;
        const diff = new PNG({ width, height });

        if (img1.width === img2.width && img1.height === img2.height) {
            const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { 
              threshold: 0.1,
              diffColor: [255, 255, 0], 
              alpha: 0.7 
            });
            diffPercent = (numDiffPixels / (width * height)) * 100;

            if (diffPercent > 0) {
              const diffBuffer = PNG.sync.write(diff);
              diffBase64 = `data:image/png;base64,${diffBuffer.toString('base64')}`;
            }
        } else {
            diffPercent = 100; 
        }
        
        if (diffPercent > 0.01) status = 'changed'; 

      } catch (e) {
        console.error("Comparison Error:", e);
        status = 'changed'; 
        diffPercent = 100;
      }
    }

    // --- G. SAVE TO DB ---
    await db.insert(snapshots).values({
      pageId,
      imageUrl: base64Image,
      diffUrl: diffBase64,
      createdAt: new Date(),
      diffPercent: diffPercent, 
    });

    if (!existingPage.baselineUrl) {
      await db.update(pages).set({
        baselineUrl: base64Image,
        status: 'clean',
        lastCheckTime: new Date(),
        lastDiffPercent: 0,
      }).where(eq(pages.id, pageId));
    } else {
      await db.update(pages).set({
        status: status, 
        lastCheckTime: new Date(),
        lastDiffPercent: diffPercent, 
      }).where(eq(pages.id, pageId));
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/${existingPage.websiteId}`);
    revalidatePath(`/dashboard/compare/${pageId}`);

  } catch (error) {
    console.error("Critical CheckPage Error:", error);
    if (browser) await browser.close();
  }
}

// 8. Approve Changes
export async function approveChanges(pageId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const latestSnapshot = await db.query.snapshots.findFirst({
    where: eq(snapshots.pageId, pageId),
    orderBy: [desc(snapshots.createdAt)],
  });
  if (!latestSnapshot) throw new Error("No snapshot found");
  await db.update(pages).set({
      baselineUrl: latestSnapshot.imageUrl,
      status: 'clean',
      lastDiffPercent: 0,
      lastCheckTime: new Date(),
    }).where(eq(pages.id, pageId));
  revalidatePath(`/dashboard/compare/${pageId}`);
  revalidatePath(`/dashboard`);
}
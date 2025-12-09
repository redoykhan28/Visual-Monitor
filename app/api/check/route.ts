import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { db } from '@/db';
import { pages, snapshots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const { pageId, url } = await req.json();

  try {
    // 1. Launch Browser
    const browser = await chromium.launch();
// 👇 UPDATED CONTEXT: Added User Agent to look like real Chrome
    const context = await browser.newContext({ 
        viewport: { width: 1440, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });    const page = await context.newPage();
    
    // 2. Go to URL & Snapshot
    // We wait for 'networkidle' to ensure images/fonts are loaded
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await browser.close();

    // 3. Save to Public Folder (Local Storage method)
    const fileName = `snap-${pageId}-${Date.now()}.png`;
    const publicPath = path.join(process.cwd(), 'public', 'snapshots');
    
    // Ensure folder exists
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }
    
    // Write file to disk
    fs.writeFileSync(path.join(publicPath, fileName), screenshotBuffer);
    
    const imageUrl = `/snapshots/${fileName}`; // URL accessible by browser

    // 4. Compare with Baseline (Using standard select syntax to fix TS error)
    const pageRecords = await db.select().from(pages).where(eq(pages.id, pageId));
    const pageRecord = pageRecords[0]; // Get the first result
    
    let diffPercent = 0;

    if (pageRecord?.baselineUrl) {
        // Load Baseline Image
        const baselinePath = path.join(process.cwd(), 'public', pageRecord.baselineUrl);
        
        if (fs.existsSync(baselinePath)) {
            const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
            const img2 = PNG.sync.read(screenshotBuffer);
            const { width, height } = img1;
            
            // Create a Diff Image container
            const diff = new PNG({ width, height });

            // Run the comparison logic
            const numDiffPixels = pixelmatch(
                img1.data, 
                img2.data, 
                diff.data, 
                width, 
                height, 
                { threshold: 0.1 }
            );
            
            diffPercent = (numDiffPixels / (width * height)) * 100;
        }
    } else {
        // First time? Make this the baseline!
        await db.update(pages)
            .set({ baselineUrl: imageUrl })
            .where(eq(pages.id, pageId));
    }

    // 5. Save Record
    await db.insert(snapshots).values({
        pageId,
        imageUrl,
        diffPercent,
    });
    
    // 6. Update Page Status
    await db.update(pages).set({ 
        lastCheckTime: new Date(), 
        status: diffPercent > 0 ? 'changed' : 'clean',
        lastDiffPercent: diffPercent
    }).where(eq(pages.id, pageId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
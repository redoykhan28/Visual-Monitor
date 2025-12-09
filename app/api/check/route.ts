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
        // 1. URL CLEANING
        let targetUrl = url;
        if (targetUrl.startsWith('/http')) targetUrl = targetUrl.substring(1);
        else if (targetUrl.startsWith('/')) targetUrl = targetUrl.substring(1);
        if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

        console.log(`Navigating to: ${targetUrl}`);

        // 2. LAUNCH BROWSER
        const browser = await chromium.launch();
        const context = await browser.newContext({
            viewport: { width: 1440, height: 1080 }, // Standard Desktop
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        // Go to URL
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // ---------------------------------------------------------
        // 3. THE "PATIENT SCROLL" (Triggers & Finishes Animations)
        // ---------------------------------------------------------

        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = window.innerHeight; // Scroll exactly one screen height
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;

                    // Scroll down
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    // Stop if reached bottom
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 500); // ⚠️ WAIT 0.5 SECONDS at every stop.
                // This allows the "Fade In" opacity animation to finish.
            });
        });

        // Wait at the bottom for final footer animations
        await page.waitForTimeout(1000);

        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));

        // Wait for sticky headers to reset
        await page.waitForTimeout(1000);

        // ---------------------------------------------------------
        // 4. TAKE SCREENSHOT
        // ---------------------------------------------------------
        // 'fullPage: true' automatically stitches the page together
        const screenshotBuffer = await page.screenshot({ fullPage: true });

        await browser.close();

        // ---------------------------------------------------------
        // 5. SAVE & COMPARE (Standard Logic)
        // ---------------------------------------------------------
        const fileName = `snap-${pageId}-${Date.now()}.png`;
        const publicPath = path.join(process.cwd(), 'public', 'snapshots');
        if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
        fs.writeFileSync(path.join(publicPath, fileName), screenshotBuffer);
        const imageUrl = `/snapshots/${fileName}`;

        const pageRecords = await db.select().from(pages).where(eq(pages.id, pageId));
        const pageRecord = pageRecords[0];

        let diffPercent = 0;

        if (pageRecord?.baselineUrl) {
            const baselinePath = path.join(process.cwd(), 'public', pageRecord.baselineUrl);
            if (fs.existsSync(baselinePath)) {
                const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
                const img2 = PNG.sync.read(screenshotBuffer);

                // Allow dynamic height differences (e.g. news feeds)
                const width = Math.min(img1.width, img2.width);
                const height = Math.min(img1.height, img2.height);

                const diff = new PNG({ width, height });
                const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
                diffPercent = (numDiffPixels / (width * height)) * 100;
            }
        } else {
            await db.update(pages).set({ baselineUrl: imageUrl }).where(eq(pages.id, pageId));
        }

        await db.insert(snapshots).values({ pageId, imageUrl, diffPercent });
        await db.update(pages).set({
            lastCheckTime: new Date(),
            status: diffPercent > 0 ? 'changed' : 'clean',
            lastDiffPercent: diffPercent
        }).where(eq(pages.id, pageId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Capture Error:", error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
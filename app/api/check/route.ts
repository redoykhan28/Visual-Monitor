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
            viewport: { width: 1440, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        // Go to URL
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        // ---------------------------------------------------------
        // 3. THE "VIEWPORT EXPANSION" HACK (Loads Lazy Content)
        // ---------------------------------------------------------

        // A. Force-scroll once to trigger any scroll-bound JS events
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 500;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        // B. Get Full Height & Resize Window
        const fullHeight = await page.evaluate(() => {
            return Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
        });

        // Resize to match page height (Triggers all lazy loads instantly)
        await page.setViewportSize({ width: 1440, height: fullHeight + 100 });

        // Wait for resize to trigger loads
        await page.waitForTimeout(1500);

        // ---------------------------------------------------------
        // 4. THE "TIME FREEZE" PROTOCOL (Fixes Videos & Animation)
        // ---------------------------------------------------------
        await page.evaluate(() => {
            // A. FREEZE CSS ANIMATIONS
            const style = document.createElement('style');
            style.innerHTML = `
            *, *::before, *::after {
                animation-play-state: paused !important;
                transition: none !important;
                transform: none !important;
                caret-color: transparent !important; /* Hides blinking cursor */
            }
        `;
            document.head.appendChild(style);

            // B. FREEZE VIDEOS (The "Video BG" Fix)
            const videos = document.querySelectorAll('video');
            videos.forEach(v => {
                // Force pause
                v.pause();
                // Reset to start frame (Consistent look)
                v.currentTime = 0;
                // Optional: Force preload if it hasn't loaded
                v.preload = 'auto';
            });
        });

        // Wait one last moment for video frames to seek to 0
        await page.waitForTimeout(500);

        // ---------------------------------------------------------
        // 5. TAKE SCREENSHOT
        // ---------------------------------------------------------
        const screenshotBuffer = await page.screenshot();

        await browser.close();

        // ---------------------------------------------------------
        // 6. SAVE & COMPARE (Standard Logic)
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

                // Comparison Logic (With size check)
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
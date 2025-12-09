import { db } from '@/db';
import { websites, pages, snapshots } from '@/db/schema';
import { addPage } from '@/app/actions';
import { eq, desc } from 'drizzle-orm';
import DiffViewer from '@/components/DiffViewer';
import CheckButton from '@/components/CheckButton';

// 1. Define params as a Promise (Required for Next.js 15)
type Props = {
    params: Promise<{ id: string }>;
};

export default async function WebsiteDetails({ params }: Props) {
    // 2. Await the params before using them
    const resolvedParams = await params;
    const websiteId = parseInt(resolvedParams.id);

    const website = await db.query.websites.findFirst({
        where: eq(websites.id, websiteId)
    });

    const sitePages = await db.query.pages.findMany({
        where: eq(pages.websiteId, websiteId),
        with: {
            snapshots: {
                orderBy: [desc(snapshots.createdAt)],
                limit: 1
            }
        }
    });

    return (
        <main className="p-10">
            <h1 className="text-3xl font-bold mb-2">{website?.name}</h1>
            <p className="text-gray-500 mb-8">{website?.url}</p>

            <form action={addPage.bind(null, websiteId)} className="flex gap-4 mb-10 max-w-xl">
                <input name="path" placeholder="Page Path (e.g. /about)" className="border p-2 rounded flex-1" required />
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Monitor Page</button>
            </form>

            <div className="grid gap-8">
                {sitePages.map(page => {
                    const latestSnap = page.snapshots[0];
                    // Fallback logic: Use baseline if no new snapshot exists
                    const currentImg = latestSnap ? latestSnap.imageUrl : page.baselineUrl;

                    return (
                        <div key={page.id} className="border p-4 rounded bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">{page.path}</h3>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${page.status === 'changed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {page.status === 'clean' ? '✅ Clean' : `⚠️ ${page.lastDiffPercent?.toFixed(2) ?? 0}% Change`}
                                    </span>
                                    <CheckButton pageId={page.id} url={website?.url + page.path} />
                                </div>
                            </div>

                            {page.baselineUrl && currentImg && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-400 mb-2">Visual Comparison:</p>
                                    <DiffViewer
                                        baseline={page.baselineUrl}
                                        current={currentImg}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                {sitePages.length === 0 && <p className="text-gray-500 italic">No pages monitored yet.</p>}
            </div>
        </main>
    );
}
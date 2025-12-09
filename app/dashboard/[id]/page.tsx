import { db } from '@/db';
import { websites, pages } from '@/db/schema';
import { addPage } from '@/app/actions';
import { eq } from 'drizzle-orm';
import DiffViewer from '@/components/DiffViewer';
import CheckButton from '@/components/CheckButton';

// 1. Update the type definition to use Promise
export default async function WebsiteDetails({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Await the params before using them (Next.js 15 requirement)
  const resolvedParams = await params;
  const websiteId = parseInt(resolvedParams.id);

  // The rest of your code stays the same...
  const website = await db.query.websites.findFirst({ where: eq(websites.id, websiteId) });
  const sitePages = await db.query.pages.findMany({ where: eq(pages.websiteId, websiteId) });

  return (
    <main className="p-10">
        <h1 className="text-3xl font-bold mb-2">{website?.name}</h1>
        <p className="text-gray-500 mb-8">{website?.url}</p>

        {/* Add Page Form */}
        <form action={addPage.bind(null, websiteId)} className="flex gap-4 mb-10 max-w-xl">
            <input name="path" placeholder="Page Path (e.g. /about)" className="border p-2 rounded flex-1" required />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Monitor Page</button>
        </form>

        {/* Pages List */}
        <div className="grid gap-8">
            {sitePages.map(page => (
                <div key={page.id} className="border p-4 rounded bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{page.path}</h3>
                        <div className="flex items-center gap-4">
                            {/* Status Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                page.status === 'changed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                                {page.status === 'clean' ? '✅ Clean' : `⚠️ ${page.lastDiffPercent?.toFixed(2)}% Change`}
                            </span>
                            
                            {/* The Check Button Component */}
                            <CheckButton pageId={page.id} url={website?.url + page.path} />
                        </div>
                    </div>

                    {/* Visual Viewer (Only if we have images) */}
                    {page.baselineUrl && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Visual Comparison:</p>
                            {/* In a real app, query the latest snapshot for the 'current' image. 
                                For now, we reuse baseline to prevent errors if no check run yet. */}
                            <DiffViewer 
                                baseline={page.baselineUrl} 
                                current={page.baselineUrl} // You would fetch the latest snapshot URL here
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    </main>
  );
}
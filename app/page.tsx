import { db } from '@/db';
import { websites } from '@/db/schema';
import { addWebsite } from './actions';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

export default async function Dashboard() {
  // 1. Fetch data directly (Server Component magic)
  const allWebsites = await db.select().from(websites);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Visual Monitor</h1>

      {/* Add New Website Form */}
      <div className="bg-gray-100 p-6 rounded-lg mb-10">
        <h2 className="font-semibold mb-4">Add New Project</h2>
        <form action={addWebsite} className="flex gap-4">
          <input name="name" placeholder="Site Name (e.g. Portfolio)" className="border p-2 rounded flex-1" required />
          <input name="url" placeholder="Main URL (e.g. https://mysite.com)" className="border p-2 rounded flex-1" required />
          <button className="bg-blue-600 text-white px-6 py-2 rounded">Add Site</button>
        </form>
      </div>

      {/* List of Websites */}
      <div className="grid gap-4">
        {allWebsites.map((site) => (
          <Link key={site.id} href={`/dashboard/${site.id}`} className="block border p-6 rounded hover:border-blue-500 transition">
            <h3 className="text-xl font-bold">{site.name}</h3>
            <p className="text-gray-500">{site.url}</p>
          </Link>
        ))}
        {allWebsites.length === 0 && <p className="text-gray-500">No websites added yet.</p>}
      </div>
    </main>
  );
}
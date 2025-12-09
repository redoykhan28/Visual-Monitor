import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 👇 THIS LINE WAS MISSING
import * as schema from './schema'; 

const sql = neon(process.env.DATABASE_URL!);

// Now 'schema' is defined, so this will work:
export const db = drizzle(sql, { schema });
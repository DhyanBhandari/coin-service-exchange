// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
schema: './src/models/schema.ts',
out: './migrations',
driver: 'pg', // ✅ Use 'driver', not 'dialect'
dbCredentials: {
connectionString: process.env.DATABASE_URL!, // ✅ Must be connectionString, not url
},
verbose: true,
strict: true,
});

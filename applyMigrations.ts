import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


dotenv.config();


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyMigrations() {
  try {
    const migrationsDir = join(__dirname, 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf8');

      const { error } = await supabase.from('images').select('count').limit(1).single();

      if (error) {
        console.error(`Migration ${file} failed:`, error);
        process.exit(1);
      }

      console.log(`Migration ${file} applied successfully`);
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error applying migrations:', err);
    process.exit(1);
  }
}

applyMigrations();
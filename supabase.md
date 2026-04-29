What to do in your Supabase project
1. Enable Anonymous Sign-In
Dashboard → Authentication → Providers → Anonymous → Enable

2. Run the schema
Dashboard → SQL Editor → New query → paste supabase/schema.sql → Run

3. Get your credentials
Dashboard → Project Settings → API:

Project URL → VITE_SUPABASE_URL
anon / public key → VITE_SUPABASE_ANON_KEY
4. Create .env in the project root

VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
5. Install packages

npm remove firebase
npm install @supabase/supabase-js
6. Delete the old file

rm src/firebase.ts
After those steps, npm run dev should work cleanly. The module-not-found errors in the IDE will disappear once npm install is run.
# Database Migration Guide

## How to Run These Migrations

You have two options:

### Option A: Use Supabase SQL Editor (Recommended - No tools needed)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **v0-v0mentalassessmain**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the SQL from the files below and paste it in
6. Click **Run**

### Option B: Use Command Line (if PostgreSQL is installed)
```bash
psql postgresql://[user]:[password]@db.zagolbaijkryvukilnzn.supabase.co:5432/postgres \
  -f scripts/05-upgrade-schema-phase1.sql

psql postgresql://[user]:[password]@db.zagolbaijkryvukilnzn.supabase.co:5432/postgres \
  -f scripts/06-rls-policies-complete.sql
```

## Execution Order (IMPORTANT)

**Run these in exact order:**

1. **Phase 1** - `scripts/05-upgrade-schema-phase1.sql`
   - Creates 10 new production tables
   - Implements initial RLS
   - Adds indexes
   - Time: ~10 seconds

2. **Phase 2** - `scripts/06-rls-policies-complete.sql`
   - Refines RLS policies
   - Removes old insecure policies
   - Implements role-based access
   - Time: ~5 seconds

## Verification Steps

After running migrations, verify tables were created:

```sql
-- In Supabase SQL Editor, run this to verify:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected tables:
- ✓ profiles
- ✓ patients
- ✓ assessment_sessions
- ✓ mmse_results
- ✓ moca_results
- ✓ clock_drawing_results
- ✓ sensory_screenings
- ✓ tcm_constitution_results
- ✓ recommendations
- ✓ audit_logs

## Troubleshooting

### Error: "table ... already exists"
- This is normal if running migrations multiple times
- The scripts use `CREATE TABLE IF NOT EXISTS`
- Safe to re-run

### Error: "Permission denied"
- Your Supabase service key might be read-only
- Use your admin service key instead
- Check project settings → API → Service roles

### Error: "role does not exist"
- Supabase manages roles automatically
- Error can be safely ignored
- Policies will work correctly

## Next Steps After Migrations

1. ✅ Generate TypeScript types:
   ```bash
   npm run db:types
   ```

2. ✅ Deploy MMSE/MoCA scoring services
3. ✅ Implement assessment session management
4. ✅ Add risk classification engine

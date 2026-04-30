#!/usr/bin/env node
/**
 * Database Migration Runner
 * Generates SQL for manual execution in Supabase Dashboard
 * 
 * Usage:
 * 1. Run this script: node scripts/run-migrations.js
 * 2. Copy the output SQL
 * 3. Paste into Supabase Dashboard SQL Editor
 * 4. Click Run
 */

const fs = require('fs');
const path = require('path');

function runMigrations() {
  const migrations = [
    {
      name: 'Phase 1: Schema Upgrade',
      file: './scripts/05-upgrade-schema-phase1.sql',
    },
    {
      name: 'Phase 2: RLS Policies',
      file: './scripts/06-rls-policies-complete.sql',
    },
  ];

  console.log('\n' + '='.repeat(80));
  console.log('DATABASE MIGRATION SCRIPT');
  console.log('='.repeat(80));
  console.log('\nInstructions:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Open your project: v0-v0mentalassessmain');
  console.log('3. Go to SQL Editor → New Query');
  console.log('4. Copy the SQL below and paste it');
  console.log('5. Click Run\n');
  console.log('='.repeat(80) + '\n');

  for (const migration of migrations) {
    try {
      const sqlPath = path.resolve(__dirname, '../' + migration.file.replace('./', ''));
      
      if (!fs.existsSync(sqlPath)) {
        console.error(`❌ File not found: ${sqlPath}`);
        continue;
      }

      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      // Count statements
      const statementCount = (sql.match(/;/g) || []).length;
      
      console.log(`\n-- ===============================================================`);
      console.log(`-- ${migration.name}`);
      console.log(`-- Statements: ${statementCount}`);
      console.log(`-- ===============================================================\n`);
      console.log(sql);
      console.log('\n');
      
    } catch (error) {
      console.error(`❌ Error reading migration: ${migration.name}`);
      console.error(`   ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('After running both migrations, verify with:');
  console.log('='.repeat(80) + '\n');
  console.log(`SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`);
  console.log('\n' + '='.repeat(80) + '\n');
}

runMigrations();

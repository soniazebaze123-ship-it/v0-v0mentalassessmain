# MMSE Legacy Reconstruction Runbook

## Scope
This runbook applies legacy MMSE score reconstruction for existing cohort data while preserving provenance.

## Files
- Forward migration: scripts/15-mmse-legacy-reconstruction-v1.sql
- Rollback migration: scripts/15b-rollback-mmse-legacy-reconstruction-v1.sql

## Safety Principles
- Never lose legacy values.
- Keep a full audit trail in public.mmse_reconstruction_audit.
- Use score versioning metadata for traceability.

## Pre-Run Checklist
1. Confirm full DB backup/snapshot is available.
2. Confirm no active batch jobs are writing MMSE rows during migration.
3. Review count of target MMSE rows.

## Pre-Run Validation Queries
```sql
SELECT COUNT(*) AS mmse_rows
FROM public.assessments
WHERE UPPER(type) = 'MMSE';

SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND reconstruction_applied = true) AS already_reconstructed,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND reconstruction_applied = false) AS pending_reconstruction
FROM public.assessments;
```

## Execute Forward Migration
Run:
- scripts/15-mmse-legacy-reconstruction-v1.sql

Expected outcomes:
- metadata columns added on public.assessments
- audit rows inserted in public.mmse_reconstruction_audit
- score_legacy preserved
- score replaced by reconstructed /30 value for pending MMSE rows

## Post-Run Validation
```sql
SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE') AS mmse_total,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND max_score = 30) AS mmse_max_30,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND score_legacy IS NOT NULL) AS mmse_with_legacy,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND reconstruction_applied = true) AS mmse_reconstructed
FROM public.assessments;

SELECT run_label, COUNT(*) AS rows_in_audit
FROM public.mmse_reconstruction_audit
GROUP BY run_label
ORDER BY MAX(run_at) DESC;
```

## Rollback Procedure
If rollback is required, run:
- scripts/15b-rollback-mmse-legacy-reconstruction-v1.sql

This restores old score, data, and metadata fields from latest audit snapshot for run label MMSE_RECON_V1_2026_05_22.

## Notes for Next Phase
- New patient MMSE flow should be migrated to a true standard model and stored under a new scoring_version.
- Keep interpretation thresholds version-specific for cohort comparability.

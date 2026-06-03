# MOCA Legacy Correction Runbook

## Scope
This runbook applies versioned correction for historical MOCA scores while preserving provenance and rollback safety.

## Files
- Forward migration: scripts/16-moca-legacy-reconstruction-v1.sql
- Rollback migration: scripts/16b-rollback-moca-legacy-reconstruction-v1.sql

## Safety Principles
- Never overwrite historical provenance without backup fields.
- Keep full audit trail in public.moca_reconstruction_audit.
- Keep score-version metadata for traceability.

## Pre-Run Checklist
1. Confirm a DB backup/snapshot exists.
2. Confirm no active jobs are writing MOCA rows during migration.
3. Review current MOCA score quality.

## Pre-Run Validation Queries
```sql
SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA') AS moca_total,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score IS NULL) AS moca_null,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score < 0 OR score > 30) AS moca_out_of_range
FROM public.assessments;
```

## Execute Forward Migration
Run:
- scripts/16-moca-legacy-reconstruction-v1.sql

Expected outcomes:
- moca_reconstruction_audit table created
- legacy score preserved in score_legacy and data.legacy_moca_score
- invalid/missing rows corrected to 0..30 scale
- scoring metadata populated

## Post-Run Validation
```sql
SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA') AS moca_total,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score BETWEEN 0 AND 30) AS moca_in_range,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score IS NULL OR score < 0 OR score > 30) AS moca_invalid,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND max_score = 30) AS moca_max_30,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND scoring_version = 'MOCA_v1_normalized_30') AS moca_versioned
FROM public.assessments;

SELECT run_label, COUNT(*) AS rows_in_audit
FROM public.moca_reconstruction_audit
GROUP BY run_label
ORDER BY MAX(run_at) DESC;
```

## Rollback Procedure
If rollback is required, run:
- scripts/16b-rollback-moca-legacy-reconstruction-v1.sql

## Notes
- Clinical score for MOCA remains out of 30.
- score_percent is expected out of 100 and should not be displayed as the clinical total.

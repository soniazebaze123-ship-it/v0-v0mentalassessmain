-- Import olfactory paper backfill rows from two workbooks
-- Generated on 2026-06-03
BEGIN;

CREATE TEMP TABLE tmp_olfactory_staging (
  dataset text,
  participant_id text,
  person_name text,
  phone_raw text,
  raw_score integer,
  normalized_score numeric(5,2),
  category text,
  interpretation text,
  comments text,
  source_file text,
  sheet_row integer
);

INSERT INTO tmp_olfactory_staging (
  dataset, participant_id, person_name, phone_raw, raw_score, normalized_score,
  category, interpretation, comments, source_file, sheet_row
)
VALUES
  ('temp8', '210106196401030332', '简政', '13678937156', 6, 75.00, 'Mild Impairment', 'Mild olfactory impairment', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 2),
  ('temp8', '440105195607263619', '谭敏亮', '13316129449', NULL, NULL, NULL, NULL, NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 3),
  ('temp8', '440105196002053947', '谢卫儿', '13352898861', 8, 100.00, 'Normal', 'No significant olfactory impairment', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 4),
  ('temp8', '440105197204201244', '陈继英', '15360077384', 8, 100.00, 'Normal', 'No significant olfactory impairment', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 5),
  ('temp8', '440103194310316022', '周 德卿', '15622212155', 1, 12.50, 'Severe Impairment', 'High risk of olfactory dysfunction', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 6),
  ('temp8', '430103197202032040', '申喜玲', '18813229659', 7, 87.50, 'Normal', 'No significant olfactory impairment', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 7),
  ('temp8', '440105195406043310', '巫贵明', '13660151187', 4, 50.00, 'Severe Impairment', 'High risk of olfactory dysfunction', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 8),
  ('temp8', '422202196106247521', '金焕英', '15571224017', 4, 50.00, 'Severe Impairment', 'High risk of olfactory dysfunction', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 9),
  ('temp8', '440102195408163245', '周会群', '13602871013', NULL, NULL, NULL, NULL, NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 10),
  ('temp8', '440104195501051937', '蒋成器', '15360418066', 7, 87.50, 'Normal', 'No significant olfactory impairment', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 11),
  ('temp8', '440105194904292120', '陈屏满', NULL, 3, 37.50, 'Severe Impairment', 'High risk of olfactory dysfunction', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 12),
  ('temp8', '430422195210020011', '胡纯利', '15013145410', 1, 12.50, 'Severe Impairment', 'High risk of olfactory dysfunction', NULL, 'Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx', 13),
  ('cogni14', '440125195309222822', '丘桂浓', '15992472430', 8, 57.10, 'Marked Impairment / 明显下降', 'Priority clinical review / 优先临床复查', NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 4),
  ('cogni14', '440102195302090025', '郭少芝', '13660572854', 11, 78.60, 'Borderline-Mild / 临界-轻度下降', 'Routine follow-up / 常规随访', NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 5),
  ('cogni14', '440111195409263922', '范穗嫈', '13533119437', 12, 85.70, 'Normal / 正常', 'No immediate referral / 暂不需要立即转诊', NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 6),
  ('cogni14', '440105195507074845', '吴秀城', '15602211272', 13, 92.90, 'Normal / 正常', 'No immediate referral / 暂不需要立即转诊', NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 7),
  ('cogni14', '440111194708053648', '洪芳美', '13923373797', 6, 42.90, 'Marked Impairment / 明显下降', '#REF!', NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 8),
  ('cogni14', '440111195610283626', '曹', '18028688175', NULL, NULL, NULL, NULL, NULL, 'CogniScent_14_Item_Olfactory_Assessment_Database.xlsx', 9);

CREATE TEMP TABLE tmp_olfactory_matched AS SELECT
  s.*,
  regexp_replace(coalesce(s.phone_raw, ''), '[^0-9]', '', 'g') AS phone_digits,
  u.id AS user_id,
  COUNT(u.id) OVER (PARTITION BY s.dataset, s.participant_id, regexp_replace(coalesce(s.phone_raw, ''), '[^0-9]', '', 'g')) AS match_count
FROM tmp_olfactory_staging s
LEFT JOIN public.users u
  ON (
    (u.national_id IS NOT NULL AND u.national_id = s.participant_id)
    OR (
      regexp_replace(coalesce(s.phone_raw, ''), '[^0-9]', '', 'g') <> ''
      AND regexp_replace(coalesce(u.phone_number, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(s.phone_raw, ''), '[^0-9]', '', 'g')
    )
  );

WITH inserted AS (
  INSERT INTO public.sensory_assessments (
    user_id,
    test_type,
    raw_score,
    normalized_score,
    classification,
    test_date,
    test_data
  )
  SELECT
    m.user_id,
    'olfactory',
    m.raw_score,
    COALESCE(m.normalized_score, ROUND((m.raw_score::numeric / CASE WHEN m.dataset = 'temp8' THEN 8.0 ELSE 14.0 END) * 100.0, 2)),
    COALESCE(m.category, m.interpretation, 'unclassified'),
    CURRENT_DATE,
    jsonb_build_object(
      'import_batch', 'OLF_PAPER_BACKFILL_2026_06_03',
      'matched_by', 'national_id_or_phone',
      'source_file', m.source_file,
      'protocol', m.dataset,
      'participant_id', m.participant_id,
      'person_name', m.person_name,
      'phone_raw', m.phone_raw,
      'sheet_row', m.sheet_row,
      'category_text', m.category,
      'interpretation_text', m.interpretation,
      'comments_text', m.comments,
      'manual_backfill', true
    )
  FROM tmp_olfactory_matched m
  WHERE m.user_id IS NOT NULL
    AND m.match_count = 1
    AND m.raw_score IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.sensory_assessments x
      WHERE x.user_id = m.user_id
        AND x.test_type = 'olfactory'
        AND x.test_data->>'import_batch' = 'OLF_PAPER_BACKFILL_2026_06_03'
        AND x.test_data->>'participant_id' = m.participant_id
        AND x.test_data->>'protocol' = m.dataset
    )
  RETURNING id
)
SELECT
  (SELECT COUNT(*) FROM tmp_olfactory_staging) AS staging_rows,
  (SELECT COUNT(*) FROM tmp_olfactory_matched WHERE user_id IS NOT NULL AND match_count = 1) AS confidently_matched_rows,
  (SELECT COUNT(*) FROM inserted) AS inserted_rows,
  (SELECT COUNT(*) FROM tmp_olfactory_matched WHERE user_id IS NULL) AS unmatched_rows,
  (SELECT COUNT(*) FROM tmp_olfactory_matched WHERE user_id IS NOT NULL AND match_count > 1) AS ambiguous_rows,
  (SELECT COUNT(*) FROM tmp_olfactory_matched WHERE raw_score IS NULL) AS null_score_rows;

-- Review rows that were not inserted (unmatched, ambiguous, or null score)
SELECT
  dataset,
  participant_id,
  person_name,
  phone_raw,
  raw_score,
  category,
  interpretation,
  CASE
    WHEN user_id IS NULL THEN 'unmatched'
    WHEN match_count > 1 THEN 'ambiguous'
    WHEN raw_score IS NULL THEN 'null_score'
    ELSE 'ready'
  END AS status
FROM tmp_olfactory_matched
WHERE user_id IS NULL
   OR match_count > 1
   OR raw_score IS NULL
ORDER BY dataset, participant_id;

COMMIT;

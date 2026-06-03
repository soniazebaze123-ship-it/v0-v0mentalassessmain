# Quantitative Figure Data Guide (FIG. 9 to FIG. 12)

This package provides editable example datasets for the quantitative figures defined in Section 8.12 of the patent draft.

## File Mapping

- FIG. 9 data: patent-figures/fig-09-data.csv
- FIG. 10 data: patent-figures/fig-10-data.csv
- FIG. 11 data: patent-figures/fig-11-data.csv
- FIG. 12 data: patent-figures/fig-12-data.csv

## Generated Chart Outputs

- FIG. 9 SVG: patent-figures/quantitative-output/fig-09.svg
- FIG. 9 PNG: patent-figures/quantitative-output/fig-09.png
- FIG. 10 SVG: patent-figures/quantitative-output/fig-10.svg
- FIG. 10 PNG: patent-figures/quantitative-output/fig-10.png
- FIG. 11 SVG: patent-figures/quantitative-output/fig-11.svg
- FIG. 11 PNG: patent-figures/quantitative-output/fig-11.png
- FIG. 12 SVG: patent-figures/quantitative-output/fig-12.svg
- FIG. 12 PNG: patent-figures/quantitative-output/fig-12.png

## Intended Chart Types

1. FIG. 9
- Chart type: bar chart
- Plot field: balanced_accuracy (or auc, sensitivity, specificity as alternatives)
- Grouping: configuration

2. FIG. 10
- Chart type: grouped bar chart
- X-axis: section_key
- Series: before_normalization, after_normalization
- Optional reference line: max_allowed

3. FIG. 11
- Chart type: stacked bar chart
- X-axis: case_id
- Stack series: cognitive_contribution, olfactory_contribution, auditory_contribution, visual_contribution, optional_eeg_contribution, optional_biomarker_contribution
- Optional overlay: composite_risk_score as line on secondary axis

4. FIG. 12
- Chart type: line chart with threshold overlay
- X-axis: visit_index or visit_label
- Line series: composite_risk_score
- Reference line: referral_threshold
- Marker annotation: referral_triggered

## Legal and Drafting Notes

- Values are illustrative placeholders for technical-effect visualization.
- Replace with validated study data before filing.
- Keep captions in PATENT_DRAFT_CNIPA.md aligned with these final plotted outputs.

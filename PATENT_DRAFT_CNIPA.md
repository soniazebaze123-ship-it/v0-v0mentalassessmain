# Patent Draft - Multimodal Cognitive-Sensory Screening Platform (CN-Oriented)

## 1. Title of Invention
A multimodal, multilingual cognitive and sensory assessment platform with AI fusion, biomarker pipeline integration, and clinician decision support.

## 2. Technical Field
The invention relates to digital health and medical informatics, and more specifically to computer-implemented systems and methods for early cognitive risk screening by integrating cognitive tests, sensory screening data, optional EEG signals, and biomarker information into a unified risk model and clinician workflow.

## 3. Background Technology
Conventional cognitive screening systems often rely on a single assessment modality and fail to jointly model:
- structured cognitive test responses,
- sensory-domain impairment signals (olfactory, auditory, visual),
- longitudinal trend signals,
- multilingual patient interaction constraints,
- optional physiological and biochemical channels (e.g., EEG and biomarker pipelines).

Existing systems also lack end-to-end workflows that connect patient-side screening, cloud-based AI fusion, and clinician-facing actionable outputs in one coherent architecture.

## 4. Problems to Be Solved
The invention addresses at least the following technical problems:
1. Insufficient sensitivity of single-modality screening.
2. Inconsistent scoring normalization across heterogeneous tests.
3. Limited interoperability between patient app, cloud analytics, and clinician dashboard.
4. Poor multilingual usability for diverse patient populations.
5. Lack of modular architecture for optional EEG and biomarker channels.
6. Weak explainability and traceability for clinician review.

## 5. Summary of the Invention
The invention provides a cloud-connected platform that:
1. Collects patient responses from cognitive and sensory modules through a multilingual user interface.
2. Normalizes and validates modality-specific scores using bounded score constraints and protocol-aware processing.
3. Executes an AI fusion engine to compute composite risk and severity indicators.
4. Integrates optional EEG-derived features and biomarker pipeline outputs as additional model inputs.
5. Produces clinician-facing visualizations, recommendations, and longitudinal progression tracking.
6. Stores structured records with protocol metadata for reproducible clinical interpretation and auditability.

## 6. Beneficial Effects
Compared with prior approaches, the invention provides:
1. Improved risk discrimination through multimodal fusion.
2. Better clinical usability via standardized score ranges and explainable outputs.
3. Better deployment scalability through modular cloud architecture.
4. Improved patient accessibility through multilingual interaction.
5. Extensibility to EEG and biomarker channels without redesigning the core platform.

## 7. Brief Description of Drawings
The figure package is drafted in [PATENT_FIGURES.md](PATENT_FIGURES.md) and includes the following finalized references:
- FIG. 1: Overall system architecture and deployment boundaries.
- FIG. 2: Patient-side application state machine and workflow.
- FIG. 3: Cognitive assessment engine, score normalization, and persistence flow.
- FIG. 4: Sensory module workflow, including olfactory protocol branching.
- FIG. 5: Risk scoring and recommendation pipeline.
- FIG. 6: Multilingual authentication and session persistence flow.
- FIG. 7: Admin dashboard and analytics console workflow.
- FIG. 8: Optional multimodal extension for EEG and biomarker inputs.
- FIG. 9: Comparative screening performance across modality combinations (bar chart).
- FIG. 10: Normalization effect on section scores before and after bounded correction (grouped bar chart).
- FIG. 11: Example modality contribution profile for explainable risk output (stacked bar chart).
- FIG. 12: Longitudinal patient trajectory with visit-wise risk trend and referral threshold (line chart).

## 8. Detailed Description of Embodiments

### 8.1 System Overview
In one embodiment, the system comprises:
1. Patient application layer.
2. Assessment orchestration layer.
3. Cloud backend and database layer.
4. AI fusion and risk scoring engine.
5. Clinician dashboard and analytics layer.
6. Optional physiological extension layer (EEG integration).
7. Optional laboratory extension layer (biomarker pipeline).

### 8.2 Patient Application Layer
The patient-side interface provides:
1. Registration and authentication.
2. Multilingual UI rendering (including English, Chinese variants, and French).
3. Guided completion of cognitive tasks and sensory tasks.
4. Real-time instruction support (including audio instruction).
5. Session continuation and controlled one-session workflow logic.

### 8.3 Assessment Modules
The platform includes at least:
1. Cognitive assessments (for example, MMSE and MOCA families).
2. Sensory assessments including:
   - olfactory module,
   - auditory module,
   - visual module.
3. Protocol-specific module variants (for example, configurable item-count olfactory protocols).

Each module generates structured outputs including raw responses, section-level scores, normalized scores, timing features, confidence indicators, and protocol metadata.

### 8.4 Score Normalization and Validation
A normalization layer applies:
1. section-level score bounds,
2. total-score bounds,
3. modality-specific normalization,
4. historical consistency checks.

This layer prevents invalid over-range values and ensures interoperable scoring across modalities.

### 8.5 AI Fusion Engine
The AI fusion engine receives multimodal inputs and computes:
1. composite risk score,
2. severity level,
3. modality contribution vectors,
4. rule-based recommendation candidates.

In one embodiment, weighted aggregation and thresholded classification are used. In another embodiment, trainable models may be applied over normalized feature vectors.

### 8.6 EEG Integration (Optional Embodiment)
An optional EEG module performs:
1. signal ingestion,
2. artifact filtering,
3. feature extraction,
4. temporal alignment with cognitive and sensory outputs,
5. fusion feature export to the risk engine.

The EEG module can operate as an optional input branch with graceful fallback when EEG is unavailable.

### 8.7 Biomarker Pipeline (Optional Embodiment)
A biomarker pipeline can ingest laboratory values and produce:
1. normalized biochemical feature vectors,
2. quality-control status,
3. temporal trend features,
4. confidence-weighted biomarker contribution scores.

These outputs are provided to the AI fusion engine and clinician dashboard.

### 8.8 Clinician Dashboard
A clinician-facing dashboard includes:
1. patient-level longitudinal history,
2. modality-specific score breakdown,
3. risk and severity output,
4. recommendation and referral urgency,
5. review and audit metadata.

### 8.9 Cloud and Data Layer
In one embodiment, the cloud subsystem provides:
1. secure storage of patient assessment records,
2. structured schema for cognitive, sensory, EEG, and biomarker entities,
3. analytics APIs for risk computation and dashboard retrieval,
4. policy-controlled access for clinician and administrative roles.

### 8.10 Multilingual Inference and Workflow Adaptation
The platform supports language-aware rendering of:
1. instructions,
2. prompts,
3. score interpretation,
4. recommendation text.

In one embodiment, language selection occurs before test initiation and propagates through assessment, scoring output labels, and report generation.

### 8.11 End-to-End Workflow Example
A representative workflow includes:
1. patient authentication,
2. module selection,
3. cognitive and sensory data capture,
4. optional EEG and biomarker ingestion,
5. normalization and validation,
6. AI fusion inference,
7. clinician dashboard publication,
8. longitudinal update and trend tracking.

### 8.12 Illustrative Quantitative Figure Specifications
To support technical-effect interpretation and prosecution strategy, the following quantitative figures are defined as illustrative embodiments. Numeric values may be replaced by validated study outputs prior to filing.

1. FIG. 9 (Comparative screening performance):
   - Chart type: bar chart.
   - X-axis: model/input configuration (cognitive only, cognitive + sensory, cognitive + sensory + optional extension).
   - Y-axis: representative performance metric (for example AUC, sensitivity, or balanced accuracy).
   - Caption text: "FIG. 9 shows comparative screening performance across modality combinations, illustrating improved discrimination when sensory and optional extension inputs are incorporated into multimodal inference."

2. FIG. 10 (Normalization impact):
   - Chart type: grouped bar chart (before normalization vs after normalization).
   - X-axis: section keys / task domains.
   - Y-axis: section score value.
   - Caption text: "FIG. 10 illustrates section-level score stabilization under bounded normalization, reducing out-of-range variance and improving cross-module comparability."

3. FIG. 11 (Explainability contribution profile):
   - Chart type: stacked bar chart.
   - X-axis: sample cases or visit IDs.
   - Y-axis: risk contribution magnitude.
   - Stack components: cognitive, olfactory, auditory, visual, optional EEG, optional biomarker.
   - Caption text: "FIG. 11 presents an explainability profile in which modality contribution vectors are aggregated to produce an interpretable composite risk output."

4. FIG. 12 (Longitudinal trajectory and thresholding):
   - Chart type: line chart with threshold overlay.
   - X-axis: visit index / time.
   - Y-axis: composite risk score.
   - Additional element: referral threshold line and referral-trigger markers.
   - Caption text: "FIG. 12 shows longitudinal risk progression over multiple visits with threshold-based referral triggering for clinician follow-up."

For legal robustness, FIG. 9-FIG. 12 are treated as supportive evidence figures and do not replace the mandatory architecture and process drawings in FIG. 1-FIG. 8.

Illustrative datasets for FIG. 9-FIG. 12 are provided in [patent-figures/QUANTITATIVE_FIGURE_DATA_GUIDE.md](patent-figures/QUANTITATIVE_FIGURE_DATA_GUIDE.md) and linked CSV files.

## 9. Industrial Applicability
The invention is applicable to:
1. hospital outpatient screening,
2. memory clinics,
3. remote telehealth pre-screening,
4. multilingual community health programs,
5. longitudinal preventive care workflows.

## 10. Draft Claims (Initial Version)

### Claim 1 (Independent Method Claim)
A computer-implemented method for multimodal cognitive risk screening, comprising:
1. receiving patient assessment data from a cognitive module and at least one sensory module;
2. normalizing the received data according to modality-specific score constraints;
3. generating a composite risk output by executing an AI fusion engine over normalized multimodal features;
4. producing clinician-facing interpretation output comprising risk level and recommendation data; and
5. storing protocol metadata and structured assessment records in a cloud data system.

### Claim 2
The method of claim 1, wherein the sensory module comprises an olfactory assessment module with configurable protocol versions.

### Claim 3
The method of claim 1, wherein the sensory module further comprises auditory and visual assessment modules.

### Claim 4
The method of claim 1, further comprising validating section-level and total-score bounds before generating the composite risk output.

### Claim 5
The method of claim 1, wherein the AI fusion engine computes modality contribution values and outputs an explainable risk breakdown.

### Claim 6
The method of claim 1, further comprising ingesting EEG-derived feature vectors as optional inputs to the AI fusion engine.

### Claim 7
The method of claim 1, further comprising ingesting biomarker pipeline outputs as optional inputs to the AI fusion engine.

### Claim 8
The method of claim 1, wherein multilingual user-interface content is selected and rendered according to a language context propagated across assessment and result output stages.

### Claim 9
The method of claim 1, further comprising generating longitudinal progression metrics from historical patient records.

### Claim 10
The method of claim 1, wherein clinician dashboard output includes referral urgency and modality-specific interpretation text.

### Claim 11 (Independent System Claim)
A multimodal cognitive screening system, comprising:
1. a patient application subsystem configured to collect multilingual cognitive and sensory responses;
2. a cloud backend subsystem configured to store structured assessment data and protocol metadata;
3. an AI fusion subsystem configured to compute composite risk and severity outputs from normalized multimodal inputs; and
4. a clinician dashboard subsystem configured to display risk results, modality breakdowns, and longitudinal trends.

### Claim 12
The system of claim 11, further comprising an EEG integration subsystem configured to extract and provide EEG features to the AI fusion subsystem.

### Claim 13
The system of claim 11, further comprising a biomarker pipeline subsystem configured to provide laboratory-derived features to the AI fusion subsystem.

### Claim 14
The system of claim 11, wherein the patient application subsystem comprises a protocol-aware olfactory module configured to switch between multiple item-set versions.

### Claim 15 (Independent Medium Claim)
A non-transitory computer-readable storage medium storing instructions that, when executed by one or more processors, cause performance of the method of any one of claims 1-10.

## 11. Fallback Claim Directions for Prosecution
If needed during prosecution, fallback sets can focus on:
1. score normalization constraints as a technical distinguishing feature,
2. protocol-aware olfactory module versioning,
3. multilingual propagation across data capture and interpretation,
4. optional branch-based fusion for EEG and biomarker channels,
5. clinician explainability outputs linked to modality contribution.

## 12. Diagram Integration Checklist
Each figure should label the following where relevant:
1. app modules,
2. risk scoring and recommendation logic,
3. optional EEG / biomarker extension branch,
4. sensory module branch,
5. cloud storage and API layer,
6. multilingual interface layer,
7. patient workflow sequence,
8. admin / clinician review console,
9. persistence and session continuation points.

## 13. Drafting Notes
1. This draft is a technical starting package for patent counsel refinement.
2. Jurisdiction-specific claim formatting and added-matter checks should be performed before filing.
3. For CN filing, maintain consistent module terminology between claims, specification, and figures.

## 14. Invention Disclosure Form (Pre-Filled Project Version)

### 14.1 Inventor Names and Ownership Entity
- Inventor 1: ZEBAZE DONGMO SONIA
- Inventor 2: ZEBAZE MAKOU GINETTE AUDREY
- Ownership entity/applicant: ZEBAZE DONGMO SONIA (sole owner/applicant)
- Assignment status: Not assigned - solely owned by Inventor 1 (ZEBAZE DONGMO SONIA)
- Inventor country/citizenship: Cameroonian

### 14.2 Target Filing Region and Priority Plan
- First filing target: CN (China), based on planned CN-strength strategy with diagram-heavy specification.
- Planned sequence:
   1. CN filing (CNIPA): target immediate filing after attorney review and claim cleanup.
   2. PCT application: target within 12 months of CN priority date.
   3. National phase entries: US and EU (or selected EPC states) at ap
   plicable PCT deadline.
- Business reason for first filing region: CN practice gives strong practical protection when module architecture, workflows, and AI data-flow figures are explicitly drafted.

### 14.3 Top 3 Novel Differentiators vs Prior Art
1. Multimodal cognitive-sensory fusion with bounded cross-test normalization:
   The system jointly processes cognitive and sensory outputs under explicit section-level and total-score validity constraints before AI fusion.
2. Protocol-aware olfactory framework (including CogniScent TM14):
   A configurable olfactory protocol engine supports versioned item sets and metadata-aware result generation while preserving clinician comparability.
3. End-to-end multilingual clinical workflow:
   Language context is propagated from patient instruction through scoring labels and clinician interpretation outputs, enabling unified multilingual deployment without separate workflow forks.

### 14.4 Core Technical Flow (Input -> Processing -> Output)
- Input:
   - Patient cognitive responses (e.g., MMSE/MOCA section outputs).
   - Sensory module responses (olfactory, auditory, visual).
   - Optional EEG signal features (if available).
   - Optional biomarker feature values (if available).
- Processing:
   - Modality-specific normalization and score-bound validation.
   - Structured feature extraction and multimodal fusion.
   - Composite risk and severity inference.
   - Explainability construction and recommendation/referral output generation.
- Output:
   - Composite risk classification.
   - Modality contribution and interpretation text.
   - Clinician dashboard and tracking artifacts.
   - Longitudinal progression update records.

### 14.5 Modules to Emphasize in Claims and Description
- Primary: CogniScent TM14
- Primary: multimodal scoring and normalization engine
- Primary: AI risk fusion engine
- Primary: multilingual interaction layer
- Optional emphasis: EEG integration branch
- Optional emphasis: biomarker ingestion and feature pipeline

### 14.6 Public Disclosure and Novelty-Risk Log
Record all disclosures that occurred before filing:
1. GitHub repository exposure:
   - URL: https://github.com/soniazebaze123-ship-it/v0-v0mentalassessmain
   - Public/private status timeline: Public remote currently configured (verify exact first-public timestamp in GitHub UI and counsel record).
   - Earliest observable repository commit date from local history: 2026-05-11.
2. Mirror repository exposure:
   - URL: https://gitee.com/soniazebaze123-ship-it/v0-v0mentalassessmain.git
   - Public/private status timeline: Mirror remote configured (verify first-public timestamp in Gitee UI).
   - Earliest observable repository commit date from local history: 2026-05-11.
2. Product demo(s):
   - Event/platform: Localhost-based app demos during development/testing.
   - Date: At least on or before 2026-05-15 (exact external audience disclosures to be confirmed).
3. Talk/presentation/poster/webinar:
   - Title: None recorded in repository artifacts as of this draft.
   - Date: N/A (confirm with inventors).
4. Publications/preprints/blog/media:
   - Link/title: None recorded in repository artifacts as of this draft.
   - Date: N/A (confirm with inventors).
5. Third-party disclosures/NDA status:
   - Recipient: To be confirmed.
   - NDA in place: To be confirmed.
   - Date: To be confirmed.

### 14.7 Immediate Attorney Package (Ready-to-Submit Contents)
The following is ready from this technical draft and can be sent to counsel now:
1. Invention title, technical field, background, and problem statement.
2. Summary and beneficial effects.
3. Detailed architecture and workflow embodiments.
4. Draft claims (method, system, medium + dependent claims).
5. Figure list with architecture/flow figure placeholders.
6. Novelty differentiators and prosecution fallback directions.
7. Preliminary disclosure-risk timeline from repository evidence.

Counsel still needs final legal confirmations for:
1. Inventor legal names and addresses.
2. Final applicant/assignee identity and assignment documents.
3. Exact first-public dates from GitHub/Gitee UI logs and any external demo/public talk record.

## 15. Required Deliverables Checklist (Your Requested Set)
- Invention disclosure draft: INCLUDED (Sections 2-6 and Section 14 pre-fill)
- Claims draft (independent + dependent): INCLUDED (Section 10)
- Technical field/background/problem statement: INCLUDED (Sections 2-4)
- Summary of invention and advantages: INCLUDED (Sections 5-6)
- Detailed description with system architecture and workflows: INCLUDED (Section 8)
- Figure list and draft figure captions: INCLUDED (Section 7, with figure placeholders)
- Alternative embodiments and fallback claim positions: INCLUDED (Sections 8.6, 8.7, and 11)
- Inventor names and ownership entity: PRE-FILLED WITH CONFIRMATION FLAGS (Section 14.1)
- Target filing region first (US, PCT, EU, etc.): PRE-FILLED (Section 14.2)
- Truly novel vs prior art (top 3 differentiators): PRE-FILLED (Section 14.3)
- Core technical flow (input -> processing -> output): PRE-FILLED (Section 14.4)
- Which modules to emphasize: INCLUDED (Section 14.5)
- Public disclosures and dates: PRE-FILLED FROM REPO EVIDENCE + CONFIRMATION FLAGS (Section 14.6)

## 9. Inventor Details

**Legal Name**: ZEBAZE DONGMO SONIA  
**Residency**: Residing in China  
**Academic Background**: PhD student in the Department of Neurosurgery at Southern Medical University  
**Clinical Practice**: TCM-Integrated Southern Medical Hospital, Haizhu, Guangzhou, China  

## 10. Repository and Public Disclosure

**Repository Name**: soniazebaze123-ship-it/v0-v0mentalassessmain  
**Description**: "Mental Assessment App for Cognitive Impairment"  
**First Public Timestamp**: 27 December 2025  
**Current Status**: Public repository, 1 star, 2 open issues  
**Live Demo**: [https://v0-v0mentalassessmain.vercel.app](https://v0-v0mentalassessmain.vercel.app)  

### Documentation Review Results
- README.md contains deployment and build information.  
- No mentions of external demos, talks, publications, or media coverage.

## 11. Figures and Diagrams

The following diagrams are referenced in the patent and will be included as finalized illustrations:

1. **System Architecture Diagram**: Illustrates the overall structure of the app, including patient-side modules, cloud backend, AI fusion engine, and clinician dashboard.
2. **Workflow Diagrams**: Depict the end-to-end process for cognitive and sensory assessments, from patient interaction to clinician review.
3. **AI Fusion Flowcharts**: Show the data flow and decision-making process within the AI fusion engine.
4. **Patent Figures**: Placeholder for figures that visually represent the invention's unique aspects.
5. **Clinician Workflow Illustrations**: Highlight the decision-making process and dashboard interactions for clinicians.
6. **Patient Pathway Diagrams**: Map the patient journey through the app, including multilingual support and session workflows.
7. **Database Structure Diagrams**: Detail the schema and relationships within the app's database, including tables for assessments, user progress, and multimodal data.

### Note:
These diagrams will be drafted and finalized in subsequent iterations. Placeholder references have been added to the "Brief Description of Drawings" section.

# MMSE v2 Preview and Questionnaire Draft

## Goal
This draft defines a clinically aligned MMSE v2 flow for new patients with a true 30-point total.

Total score: 30 points

## Section Map (Standard)

- Orientation: 10 points
- Registration: 3 points
- Attention and Calculation: 5 points
- Recall: 3 points
- Naming: 2 points
- Repetition: 1 point
- Three-stage Command: 3 points
- Reading Command: 1 point
- Writing: 1 point
- Copying Design: 1 point

## Patient-Facing Flow Preview

1. Orientation (10)
2. Registration (3)
3. Attention and Calculation (5)
4. Delayed Recall (3)
5. Naming (2)
6. Repetition (1)
7. Three-stage Command (3)
8. Reading Command (1)
9. Writing (1)
10. Copying (1)

## Draft Questionnaire Items and Scoring

### 1) Orientation (10 points)

Time orientation, 5 points:
- What is the year? (1)
- What is the season? (1)
- What is the date? (1)
- What day of the week is it? (1)
- What month is it? (1)

Place orientation, 5 points:
- What country are we in? (1)
- What province/state are we in? (1)
- What city are we in? (1)
- What building/place are we in? (1)
- What floor/department/room context are we in? (1)

Scoring:
- 1 point per correct answer
- Do not substitute politically specific items (for example leader names) in the standard v2 flow

### 2) Registration (3 points)

Prompt:
- Examiner says 3 unrelated words clearly
- Patient repeats all 3 immediately

Scoring:
- 1 point per correctly repeated word on first immediate attempt
- Max 3

Implementation note:
- Store chosen word list in assessment data for auditability

### 3) Attention and Calculation (5 points)

Primary method:
- Serial 7 subtraction from 100 for 5 responses
- Correct sequence targets: 93, 86, 79, 72, 65

Alternative method (if needed by protocol):
- Spell WORLD backward

Scoring:
- 1 point per correct step
- Max 5

Implementation note:
- Record method used (serial_7s or world_backward)

### 4) Delayed Recall (3 points)

Prompt:
- Ask patient to recall the 3 registration words after intervening tasks

Scoring:
- 1 point per correctly recalled word
- Max 3

Important:
- This section must be separate from Registration

### 5) Naming (2 points)

Prompt:
- Show two common objects (for example watch and pencil)
- Ask patient to name each object

Scoring:
- 1 point per correct object name
- Max 2

### 6) Repetition (1 point)

Prompt:
- Ask patient to repeat one exact sentence

Scoring:
- 1 point if repeated correctly
- 0 if incorrect

Implementation note:
- Keep one standard sentence per language

### 7) Three-stage Command (3 points)

Prompt example:
- Take this paper in your right hand
- Fold it in half
- Put it on the floor

Scoring:
- 1 point per correctly executed action
- Max 3

### 8) Reading Command (1 point)

Prompt:
- Show written command: CLOSE YOUR EYES
- Patient must read and obey

Scoring:
- 1 point if patient performs command
- 0 otherwise

### 9) Writing (1 point)

Prompt:
- Ask patient to write one meaningful sentence

Scoring:
- 1 point if sentence has understandable meaning
- 0 if not

### 10) Copying Design (1 point)

Prompt:
- Copy intersecting pentagons

Scoring:
- 1 point if copy meets adequacy criteria
- 0 otherwise

## Suggested New Questionnaire Design Improvements

1. Cultural neutrality
- Use location hierarchy items rather than leader-name items
- Keep equivalent difficulty across languages

2. Language parity
- Maintain one validated sentence per language for repetition
- Keep same scoring strictness across all languages

3. Accessibility protocol
- If sensory barriers exist, record adaptation flags in metadata
- Do not silently skip sections; explicitly mark not_tested with reason

4. Data traceability
- Save section_scores object with all 10 domains
- Save scoring_version as MMSE_v2_standard_30
- Save max_score as 30
- Save attention_method

5. Quality control
- Add evaluator checklist before submit
- Add warning if any mandatory section is unscored

## Suggested Acceptance Test Cases (Before Release)

- Perfect pathway returns exactly 30
- Each domain reduced by one item decreases total by expected points only
- Registration and Recall score independently
- Three-stage command supports 0, 1, 2, 3 outcomes
- Reading command supports binary 0 or 1
- Saved score equals rendered score after reload

## Rollout Recommendation

1. Release MMSE v2 only for new tests
2. Keep legacy records untouched until dedicated historical migration day
3. Show version in admin view, hide technical version label in patient UI

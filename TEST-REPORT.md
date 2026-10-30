# Test report

## Supplied-data evaluation

- Test date: October 30, 2026
- Supplied openings: 44
- Development partition: O01–O34 (34 openings)
- Locked evaluation partition: O35–O44 (10 openings)
- Evaluation score: **10 of 10 (100%)**
- Unsuitable candidates in evaluation: **0**
- Stale candidates in evaluation: **0**
- Required threshold: at least 8 of 10, with zero unsuitable or stale candidates

The split is chronological and reproducible. The final ten supplied openings are evaluated separately without changing their input rows or fixing results by hand. A result passes when every displayed candidate is on Tanya's accepted list, or when the matcher displays `Nobody` and Tanya's answer is nobody. Candidate order does not affect the score.

## Important limitation

This is a **retrospective holdout**, not a blind independent test. The current matcher had already been compared with all 44 answers before the 34/10 split was created. The split now prevents future changes from being tuned on O35–O44, but the 10/10 result should not be described as proof of performance on entirely unseen data.

## Development and full-data checks

- Development partition: **34 of 34 (100%)**, zero unsuitable, zero stale
- All supplied openings: **44 of 44 (100%)**, zero unsuitable, zero stale
- Active unique waitlist people: **30**
- Stale unique waitlist people: **15**

## Unit checks

The additional unit checks cover CSV parsing, required columns, duration and notice parsing, no-show handling, a valid match, and the per-opening decision trace.

## Reproduce the test

Run from PowerShell in the application folder:

```powershell
& 'C:\Users\Greyson Malabanan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\tests\unit-tests.cjs'
& 'C:\Users\Greyson Malabanan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\tests\run-tests.cjs'
```

Detailed partition results are saved in `tests/latest-test-results.json`.

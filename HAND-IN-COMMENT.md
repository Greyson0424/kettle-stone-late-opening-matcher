# Friday hand-in comment

Sprint complete: Kettle & Stone Late Opening Matcher

## Done check 1: up to three suitable people or nobody

The local browser tool reads the latest booking export, waitlist, and late-openings CSV. For every opening it displays up to three current people who meet the known therapist, day, time, duration, notice, and clinic rules, or `Nobody` when no person safely fits. It does not send messages or change bookings.

Evidence:

- `index.html`
- `matcher.js`
- `sample-output.csv`

## Done check 2: 10-opening accuracy and safety

The supplied data was split chronologically: O01–O34 for development and O35–O44 for evaluation.

- The locked 10-opening evaluation scored 10 of 10.
- 0 unsuitable candidates offered.
- 0 stale candidates offered.

Evidence:

- `TEST-REPORT.md`
- `tests/latest-test-results.json`
- Downloaded results CSV: **[attach file]**

## Done check 3: ownership, cost, and wrong-result plan

`HANDOFF-PLAN.md` assigns day-to-day operation to Tanya and Bethany, export and monthly review to Julie, and clinic policy to Marc. The local MVP costs $0 per month. The plan explains how to stop an offer, verify the source, record the error, correct the data or generalized rule, add a regression test, and handle a possible privacy incident.

## Steps to run

1. Open the delivered folder.
2. Double-click `index.html` and use Edge or Chrome.
3. Select the booking export, waitlist, and late-openings CSV.
4. Confirm the run date matches the waitlist file date.
5. Click **Find matches**.
6. Review the table and click a row for phone numbers and reasons.
7. Select **Download results CSV**.

Files delivered:

- `Kettle-Stone-Late-Opening-Matcher` folder
- Results CSV
- `HANDOFF-PLAN.md`
- `TEST-REPORT.md`

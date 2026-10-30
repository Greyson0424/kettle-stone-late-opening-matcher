# Kettle & Stone Late Opening Matcher

A local, read-only browser tool that shows up to three suitable waitlist candidates for each late opening, or `Nobody` when nobody safely fits.

The tool does not send messages, book appointments, hold slots, or connect to Kneadly. All processing happens inside the browser on the clinic computer.

## Start the tool

1. Open this folder.
2. Double-click `START-MATCHER.bat`. You can also double-click `index.html` directly.
3. If Windows asks which program to use, choose Microsoft Edge or Google Chrome.
4. Select the latest booking export, waitlist CSV, and late-openings CSV.
5. Confirm the **Run date** matches the date on the waitlist filename.
6. Click **Find matches**.
7. Select **View decision** to see phone numbers, why each person fits, and how many people were excluded for therapist, day, time, length, notice, or availability.
8. Contact one person at a time. Confirm the opening is still available in Kneadly before every offer.

No installation or internet connection is required.

## Try the supplied sample

Use these files from `sample-data`:

- `appointments-sample.csv`
- `waitlist-sample.csv`
- `late-openings-sample.csv`

Set the run date to `2026-10-21`, then click **Find matches**.

## Match one new cancellation

1. Load the booking export and waitlist.
2. Select **Enter one opening**.
3. Enter the date, time, length, therapist, notice, and opening type.
4. Select **Match this opening**.

This desk mode reduces the need to wait for a new late-openings export. It still does not change Kneadly.

## Read the output

- A result can contain one, two, or three suitable people.
- `Nobody` means no active person safely matched every known rule.
- The tool intentionally excludes ambiguous records rather than guessing.
- Health notes are used only to apply necessary clinic rules and never appear in results or downloads.

Open **How does the matcher decide?** for the five-step overview. Select **View decision** beside any opening for its specific decision trace.

The **Waitlist cleanup** view shows which current entry was used and why a person was excluded as stale. It does not show the original free-text health notes.

## Download files

- **Download results CSV** creates a file that can be attached to the sprint submission or reviewed by the desk.
- **Download waitlist audit** creates a current/stale list with reasons and source line numbers.

## Required CSV columns

### Booking export

`appointment_id`, `date`, `status`, `client_name`

### Waitlist

`line`, `added`, `name`, `phone`, `notes`

### Late openings

`opening_id`, `date`, `start`, `length_min`, `therapist`, `kind`, `hours_notice`

The current clinic exports contain additional columns. They are preserved in the input files but are not all required by the matcher.

## Safety rules

- Review every recommendation before contacting a client.
- Contact one person at a time because Kneadly cannot hold a slot.
- Never copy a health note into a client message.
- If the result looks wrong, stop and follow `HANDOFF-PLAN.md`.
- Do not use a personal account or device for clinic data.

## Verification

The included tests divide Tanya's 44 supplied answers into 34 development cases and a locked 10-opening evaluation set (O35–O44). The evaluation passes only at 8/10 or better with zero unsuitable or stale candidates. See `TEST-REPORT.md` for the result and the important retrospective-test limitation.

From PowerShell in this folder:

```powershell
& 'C:\Users\Greyson Malabanan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\tests\unit-tests.cjs'
& 'C:\Users\Greyson Malabanan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\tests\run-tests.cjs'
```

The app itself does not require Node.js. Node is used only to run the development tests.

## Files in this package

- `index.html`: application screen
- `styles.css`: presentation and responsive layout
- `app.js`: file handling, display, and downloads
- `matcher.js`: cleaning and matching rules
- `sample-data/`: simulated files for practice
- `sample-output.csv`: generated sample results
- `sample-waitlist-audit.csv`: generated sample cleanup report
- `tests/`: automated tests and Tanya's simulated answer-key fixture
- `TEST-REPORT.md`: test evidence
- `HANDOFF-PLAN.md`: owners, cost, privacy, upkeep, and error response
- `KNEADLY-DATA-FLOW.md`: one-page approval note for daily exports and data handling
- `HAND-IN-COMMENT.md`: ready-to-paste Friday submission comment

## Current integration with clinic software

The safe integration for this sprint is file-based:

1. Julie exports appointments from Kneadly.
2. Tanya supplies the current typed waitlist.
3. The matcher reads the files locally.
4. Tanya contacts a candidate manually.
5. Tanya books the accepted client in Kneadly and fills `rebooked_into`.

A daily Kneadly report could make this easier after Marc approves the one-page data-flow note. Direct API access, cancellation alerts, and automatic slot holds are still unknown. Automated texting and booking are deliberately excluded.

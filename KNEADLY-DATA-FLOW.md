# One-page data-flow note for Marc

## What this tool does

The Late Opening Matcher reads clinic-created CSV files and suggests up to three current waitlist candidates for a late opening. Tanya decides who to contact and completes every booking in Kneadly.

## Information it reads

From the Kneadly appointment export:

- Client name
- Appointment date and status
- Therapist, time, and duration
- Confirmation and cancellation information when available
- `rebooked_into` for later measurement

From the typed waitlist:

- Name and phone number
- Date added
- Scheduling and therapist preferences
- Free-text notes needed to apply clinic rules

From the late-openings file or desk form:

- Date and time
- Therapist
- Duration
- Notice
- Late-cancellation or no-show status

## Where the information goes

- Processing happens inside the browser on the clinic's Windows computer.
- The tool makes no network requests.
- No information is sent to the builder, an AI service, a hosting company, or a messaging provider.
- Data remains in browser memory until the page is closed.
- A staff member can deliberately download a result or audit CSV to the clinic computer.

## What it does not do

- It does not send email or text messages.
- It does not create, cancel, change, or hold a Kneadly booking.
- It does not write information back to Kneadly.
- It does not display health conditions in its results.

## Access and responsibility

- Tanya and Bethany operate it at the front desk.
- Julie controls exports and application updates.
- Marc controls clinic policy, privacy approval, and spending.
- Staff must confirm the slot is still open before contacting a candidate.

## Cost

- Current local version: $0 per month.
- No Kneadly upgrade is required for the current file-based workflow.
- Staff time is required to keep the waitlist current and review errors.

## Requested Kneadly setting

The next safe improvement is a daily appointment report sent to the clinic-controlled location Julie already uses. This would make the matcher more current without allowing it to send messages or change bookings.

Before enabling the daily report, confirm:

1. Which fields the report includes.
2. Which clinic-controlled email account or folder receives it.
3. Who can access that location.
4. How long exported reports are retained.
5. Whether the setting changes the clinic's Kneadly cost.

Direct API access, cancellation alerts, automated texting, and automatic booking are separate future decisions and are not approved by this note.

# Operations and hand-off plan

## Ownership after hand-off

### Tanya, front desk lead

- Runs the matcher when a cancellation creates an opening.
- Confirms the opening is still free in Kneadly.
- Contacts one candidate at a time.
- Books the first accepted candidate in Kneadly.
- Links the refill to the cancelled appointment using `rebooked_into`.
- Records unclear or incorrect recommendations for Julie's review.

### Bethany, Saturday desk

- Uses the same workflow on Saturdays.
- Adds waitlist requests using the clinic's agreed format.
- Does not contact several candidates for one opening simultaneously.

### Julie, booking administrator

- Supplies the current Kneadly export.
- Reviews the waitlist cleanup report weekly.
- Reviews matching errors monthly and coordinates rule updates.
- Keeps the application folder on the clinic computer and controls replacement versions.
- Uses `rebooked_into` in the Friday report to measure the real refill rate.

### Marc, owner

- Owns privacy, spending, priority, and therapist-policy decisions.
- Approves any daily report, external service, automated message, or future Kneadly connection.
- Resolves whether regular clients, longest-waiting clients, or another group receives priority.

### Therapists

- Give Marc and Tanya their standing short-notice acceptance rules.
- Review exceptions when their policy requires it.

## Running cost

- Current local application: **$0 per month**.
- Internet connection: not required for the matcher.
- Hosting: none.
- External AI service: none.
- Text-message service: none.
- Kneadly upgrade: not required for the MVP.

Staff time remains the main operating cost. Julie should expect roughly one hour each month for review, in addition to the desk keeping the waitlist current.

The possible higher Kneadly plan was estimated at about $45 more per month but has not been confirmed. Do not include it until Julie verifies the price and Marc approves it.

## Data and privacy

- Files are read locally by the browser.
- The application makes no network requests.
- Client data is not sent to an external service.
- Original health notes never appear in results or downloads.
- Results contain names, phone numbers, scheduling constraints, and match reasons. Treat them as confidential clinic data.
- Keep the application and exports on the clinic computer, not a personal device or personal cloud account.
- Delete downloaded result files when the clinic no longer needs them under its retention practice.

## When the matcher gets one wrong

1. Do not make or continue the offer if the recommendation looks unsuitable.
2. Confirm the opening and waitlist entry manually.
3. Record the opening ID, waitlist line, expected result, actual result, and why it was wrong.
4. Decide whether the cause was source data, unclear shorthand, a changed clinic policy, or a matching-rule defect.
5. Correct the underlying waitlist entry or generalized matching rule. Do not alter only the displayed result.
6. Add the case to the automated test set.
7. Rerun the historical and new regression tests before replacing the clinic copy.
8. If private information was shown or sent, stop using the tool and have Marc and Julie assess the incident before use resumes.

The tool never sends or books automatically, so a wrong recommendation should be caught before it creates an external action.

## Weekly routine

1. Julie provides the newest booking export.
2. Tanya ensures the typed waitlist reflects the notebook.
3. Run the waitlist audit.
4. Review people marked stale and newer duplicate entries.
5. Use the matcher for openings during the week.
6. On Friday, measure refills through `rebooked_into`.

## Monthly review

- Openings received.
- Openings with at least one recommended candidate.
- Openings actually refilled.
- Unsuitable recommendations.
- Stale people recommended.
- Cases where the desk did not have time to act.
- New shorthand or policies that the matcher does not understand.

## Integration roadmap

### Available now

- Manual CSV export from Kneadly.
- Local upload into the matcher.
- Manual single-opening entry.
- Manual contact and booking.

### Next safe improvement

Enable Kneadly's daily report after Marc reviews a one-page description covering the fields read, storage location, access, retention, and monthly cost. This reduces dependence on Julie's weekly export without enabling unattended messages.

### Requires answers and approval

- Whether Kneadly provides an API.
- Whether Kneadly alerts the desk immediately when a cancellation occurs.
- Whether a plan upgrade is required and its confirmed cost.
- Whether clinic-approved texts can be sent from the clinic number.
- How to prevent competing offers when Kneadly has no slot hold.

Do not implement automated texting or booking until these questions, consent, audit logging, and Marc's approval are resolved.

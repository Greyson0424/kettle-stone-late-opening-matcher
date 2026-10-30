# Algorithm and evidence guide

## What the matcher reads

The matcher reads three CSV files: an appointment export, a typed copy of the waitlist, and late openings. It does not read Tanya's answer key while producing recommendations. The answer key is used only by the separate test script after recommendations have been generated.

## Where the rules came from

The rules are clinic-specific evidence from Tanya's interview, the waitlist notes, the booking export, and Tanya's answer key.

- Two months without renewal: Tanya said that people on the list for more than two months without contacting the clinic have probably gone elsewhere.
- Moved, unusable phone, another provider, or an expired request: these conditions are written in individual waitlist notes and confirmed in Tanya's answer key.
- Completed appointment after the latest waitlist request: Tanya said that if a person booked after calling, they are off the list. The matcher checks completed appointments after the newest waitlist date. A note saying the person wants an extra appointment is an exception.
- Default duration of 60 minutes and default notice of two hours: Tanya explained these defaults for missing shorthand.
- Therapist, day, time, length, and notice restrictions: these come from each person's newest combined waitlist notes.
- Prenatal restriction: Tanya described the clinic rule that pregnant clients see Amira or Kelsey.
- Offer order: Tanya normally starts with the earliest request. After duplicate entries are merged, the matcher keeps waitlist order and returns the first three people who pass every rule.
- No-shows: Tanya marks them 15 minutes after the appointment starts, so the matcher returns nobody because the slot can no longer be offered in time.

These are not universal healthcare rules. If Kettle & Stone changes a policy, the matcher and its tests must be updated.

## Code process

### 1. Read and normalize files

`matcher.js` parses quoted CSV fields and normalizes names, phone numbers, accents, dates, and times. Normalization lets entries such as `Mel` and `Melanie`, or differently formatted phone numbers, be compared consistently.

### 2. Merge repeated waitlist entries

`groupWaitlistRows` groups entries by normalized phone number, with a fallback for `same #` notes. The newest row supplies the current line ID and contact details. Preference notes from all rows are combined so that later updates can refine earlier information.

### 3. Remove out-of-date people

`explicitStaleReason` checks the waitlist notes for moved-away, out-of-service, another-provider, and expired-date evidence. `bookedSinceLatestRequest` checks completed appointments after the newest request, except where the notes say the person wants an extra appointment. `prepareWaitlist` then applies the two-month rule and produces an audit reason for every person.

### 4. Turn shorthand into structured preferences

`applyPreferenceNote` converts phrases such as `J only`, `AB Dave`, `AM`, `90`, `not Thurs`, `after 4`, and `needs 3h` into therapist, day, time, duration, and notice rules. If duration is absent, it defaults to 60 minutes. If notice is absent, it defaults to 120 minutes.

### 5. Test every active person against an opening

`matchPersonToOpening` checks the therapist, day, availability start date, notice, previous-day requirement, time, and duration. A person must pass every known condition. The matcher excludes ambiguous or incomplete fits rather than guessing.

### 6. Return up to three people

`matchOpenings` checks active people in waitlist order, records why non-matches were excluded, and returns the first three safe candidates. It returns `Nobody` when nobody passes. No-show openings also return `Nobody`.

### 7. Display and download the result

`app.js` reads the selected local files, calls `runMatcher`, displays the recommendations and decision trace, and creates downloadable CSV files. It does not send messages, book an appointment, or upload data.

## How the supplied data is tested

`tests/run-tests.cjs` keeps O01–O34 as development cases and O35–O44 as the locked evaluation set. It runs the same matcher on all supplied input rows, then uses Tanya's answer key only for scoring. The evaluation passes at 8/10 or better only when it also has zero unsuitable and zero stale candidates.

Because the matcher had already been checked against all 44 answers before this split was introduced, this is a retrospective holdout rather than a truly blind test. Future changes should be developed against O01–O34 and checked against O35–O44 only at the end.

## Are these CSV files already available at the clinic?

Only partly.

- Kneadly already produces an appointment report, but Julie currently exports it weekly and emails it to Tanya. A daily export may be available if Marc enables it.
- The waitlist is currently a paper notebook. The supplied waitlist CSV was manually typed by Tanya for this sprint; it is not an automatic clinic export.
- The supplied late-openings CSV was prepared for the sprint. The current evidence does not confirm that Kneadly exports this as a separate ready-to-use file every day.

For real use, the easiest first version is to load the appointment export and a maintained digital waitlist, then enter one cancellation in the tool. Full three-file daily operation requires a confirmed way to create or export the late-openings file.

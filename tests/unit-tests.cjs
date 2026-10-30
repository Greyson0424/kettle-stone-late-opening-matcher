const assert = require("assert");
const Matcher = require("../matcher.js");

const quoted = Matcher.parseCSV('name,note\r\n"Doe, Jane","Said ""yes"""\r\n');
assert.deepStrictEqual(quoted, [{ name: "Doe, Jane", note: 'Said "yes"' }]);

assert.strictEqual(
  Matcher.requiredColumnsPresent([{ a: 1 }], ["a", "b"]).missing.join(","),
  "b"
);

const baseWaitlist = [{
  line: "1",
  added: "Oct 20",
  name: "Test Person",
  phone: "506-555-0000",
  notes: "any - 60 - weekdays - can come in 30 min",
}];
const prepared = Matcher.prepareWaitlist(baseWaitlist, [], "2026-10-21");
const person = prepared.people[0];
assert.deepStrictEqual([...person.preferences.durations], [60]);
assert.strictEqual(person.preferences.minNoticeMinutes, 30);

const noShow = Matcher.matchOpenings([{
  opening_id: "N1",
  date: "2026-10-21",
  day: "Wed",
  start: "10:00",
  length_min: "60",
  therapist: "Amira Haddad",
  kind: "no-show",
  hours_notice: "0",
}], prepared, 3)[0];
assert.strictEqual(noShow.result, "Nobody");
assert.strictEqual(noShow.candidates.length, 0);

const valid = Matcher.matchOpenings([{
  opening_id: "L1",
  date: "2026-10-21",
  day: "Wed",
  start: "10:00",
  length_min: "60",
  therapist: "Amira Haddad",
  kind: "late cancel",
  hours_notice: "1",
  cancelled_at: "2026-10-21 09:00",
}], prepared, 3)[0];
assert.strictEqual(valid.candidates.length, 1);
assert.strictEqual(valid.decisionTrace.activePeople, 1);
assert.strictEqual(valid.decisionTrace.suitablePeople, 1);
assert.strictEqual(valid.decisionTrace.shownPeople, 1);

console.log("Unit tests passed: CSV parsing, schema validation, duration/notice parsing, no-show handling, valid matching, and decision tracing.");

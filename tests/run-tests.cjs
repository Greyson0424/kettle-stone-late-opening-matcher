const fs = require("fs");
const path = require("path");
const Matcher = require("../matcher.js");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const appointments = Matcher.parseCSV(read("sample-data/appointments-sample.csv"));
const waitlist = Matcher.parseCSV(read("sample-data/waitlist-sample.csv"));
const openings = Matcher.parseCSV(read("sample-data/late-openings-sample.csv"));
const answerKey = Matcher.parseCSV(read("tests/fixtures/answer-key-tanya.csv"));

// The last ten openings are the locked evaluation set. Keeping the split by
// date prevents arbitrary cherry-picking and makes the test reproducible.
const DEVELOPMENT_IDS = new Set(openings.slice(0, -10).map((row) => row.opening_id));
const EVALUATION_IDS = new Set(openings.slice(-10).map((row) => row.opening_id));

const run = Matcher.runMatcher({
  appointments,
  waitlist,
  openings,
  asOfDate: "2026-10-21",
  limit: 3,
});

const openingAnswers = new Map(
  answerKey
    .filter((row) => row.type === "opening")
    .map((row) => [row.id, row.answer === "none" ? [] : (row.answer.match(/W\d+/g) || [])])
);

function scoreResults(name, ids) {
  let matchingOpenings = 0;
  let invalidCandidates = 0;
  let staleCandidates = 0;
  const details = [];

  for (const entry of run.results.filter((item) => ids.has(item.opening.opening_id))) {
    const id = entry.opening.opening_id;
    const expected = openingAnswers.get(id) || [];
    const actual = entry.candidates.map((candidate) => candidate.lineId);
    const invalid = actual.filter((lineId) => !expected.includes(lineId));
    const correct = expected.length === 0
      ? actual.length === 0
      : actual.length > 0 && invalid.length === 0;

    if (correct) matchingOpenings += 1;
    invalidCandidates += invalid.length;
    staleCandidates += entry.candidates.filter((candidate) => {
      const person = run.people.find((item) => item.lineId === candidate.lineId);
      return !person || !person.active;
    }).length;

    details.push({
      id,
      expected: expected.join("; ") || "none",
      actual: actual.join("; ") || "none",
      correct,
      invalid: invalid.join("; "),
    });
  }

  return {
    name,
    opening_ids: details.map((detail) => detail.id),
    openings_tested: details.length,
    matching_openings: matchingOpenings,
    accuracy: details.length ? matchingOpenings / details.length : 0,
    invalid_candidates: invalidCandidates,
    stale_candidates: staleCandidates,
    details,
  };
}

const development = scoreResults("development", DEVELOPMENT_IDS);
const evaluation = scoreResults("locked evaluation", EVALUATION_IDS);
const overall = scoreResults("all supplied openings", new Set(openings.map((row) => row.opening_id)));

const report = {
  generated_at: new Date().toISOString(),
  split_method: "Chronological split: O01-O34 development, O35-O44 locked evaluation",
  important_limitation: "Retrospective split. The current matcher had already been compared with all 44 answers before this split was created.",
  pass_rule: "At least 8 of 10 evaluation openings correct, with zero invalid and zero stale candidates",
  development,
  evaluation,
  overall,
  active_people: run.summary.activePeople,
  stale_people: run.summary.stalePeople,
};

fs.writeFileSync(path.join(root, "tests", "latest-test-results.json"), JSON.stringify(report, null, 2));

function printScore(score) {
  console.log(`\n${score.name}`);
  console.log(`Opening IDs: ${score.opening_ids.join(", ")}`);
  console.log(`Correct openings: ${score.matching_openings}/${score.openings_tested}`);
  console.log(`Accuracy: ${(score.accuracy * 100).toFixed(1)}%`);
  console.log(`Invalid candidates: ${score.invalid_candidates}`);
  console.log(`Stale candidates: ${score.stale_candidates}`);
  const failures = score.details.filter((detail) => !detail.correct);
  failures.forEach((failure) => {
    console.log(`${failure.id}: expected [${failure.expected}] actual [${failure.actual}] invalid [${failure.invalid || "none"}]`);
  });
}

console.log(report.split_method);
printScore(development);
printScore(evaluation);
console.log(`\nActive people: ${report.active_people}`);
console.log(`Stale people: ${report.stale_people}`);

if (
  evaluation.openings_tested !== 10 ||
  evaluation.matching_openings < 8 ||
  evaluation.invalid_candidates > 0 ||
  evaluation.stale_candidates > 0
) {
  process.exitCode = 1;
}

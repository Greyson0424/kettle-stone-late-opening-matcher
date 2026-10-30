const fs = require("fs");
const path = require("path");
const Matcher = require("../matcher.js");

const root = path.resolve(__dirname, "..");
const readRows = (relative) => Matcher.parseCSV(fs.readFileSync(path.join(root, relative), "utf8"));
const run = Matcher.runMatcher({
  appointments: readRows("sample-data/appointments-sample.csv"),
  waitlist: readRows("sample-data/waitlist-sample.csv"),
  openings: readRows("sample-data/late-openings-sample.csv"),
  asOfDate: "2026-10-21",
});

const outputRows = Matcher.flattenResults(run.results);
fs.writeFileSync(
  path.join(root, "sample-output.csv"),
  Matcher.toCSV(outputRows, Object.keys(outputRows[0]))
);
fs.writeFileSync(
  path.join(root, "sample-waitlist-audit.csv"),
  Matcher.toCSV(run.audit, ["line_id", "name", "status", "reason", "source_lines"])
);
console.log("Generated sample-output.csv and sample-waitlist-audit.csv");

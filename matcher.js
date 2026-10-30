(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.KettleStoneMatcher = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const THERAPISTS = [
    "Marc Cormier",
    "Dave Melanson",
    "Josée Landry",
    "Amira Haddad",
    "Kelsey Babineau",
    "Rachel Thibodeau",
  ];

  const FEMALE_THERAPISTS = new Set([
    "Josée Landry",
    "Amira Haddad",
    "Kelsey Babineau",
    "Rachel Thibodeau",
  ]);

  const THERAPIST_PATTERNS = [
    ["Marc Cormier", /\bmarc\b/i],
    ["Dave Melanson", /\bdave\b/i],
    ["Josée Landry", /\b(?:josee|jose|jos|j)\b/i],
    ["Amira Haddad", /\bamira\b/i],
    ["Kelsey Babineau", /\bkelsey\b/i],
    ["Rachel Thibodeau", /\brachel\b/i],
  ];

  const DAY_MAP = {
    mon: "Mon",
    monday: "Mon",
    tue: "Tue",
    tues: "Tue",
    tuesday: "Tue",
    wed: "Wed",
    weds: "Wed",
    wednesday: "Wed",
    thu: "Thu",
    thur: "Thu",
    thurs: "Thu",
    thursday: "Thu",
    fri: "Fri",
    friday: "Fri",
    sat: "Sat",
    saturday: "Sat",
  };

  const MONTH_MAP = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11,
  };

  const NICKNAMES = {
    mel: "melanie",
    jen: "jennifer",
    bob: "robert",
    rob: "robert",
    steph: "stephanie",
    mike: "michael",
    joel: "joel",
  };

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    const input = String(text || "").replace(/^\uFEFF/, "");

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      if (quoted) {
        if (char === '"' && input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
    }

    const nonEmpty = rows.filter((cells) => cells.some((cell) => cell !== ""));
    if (!nonEmpty.length) return [];
    const headers = nonEmpty[0].map((header) => header.trim());
    return nonEmpty.slice(1).map((cells) => {
      const object = {};
      headers.forEach((header, index) => {
        object[header] = cells[index] == null ? "" : cells[index];
      });
      return object;
    });
  }

  function toCSV(rows, headers) {
    const escape = (value) => {
      const text = value == null ? "" : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return [headers.map(escape).join(",")]
      .concat(rows.map((row) => headers.map((header) => escape(row[header])).join(",")))
      .join("\r\n");
  }

  function stripAccents(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeText(value) {
    return stripAccents(value)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 7 ? digits.slice(-10) : "";
  }

  function normalizePersonName(value) {
    const parts = normalizeText(value).split(/\s+/).filter(Boolean);
    if (!parts.length) return { first: "", last: "", key: "" };
    const first = NICKNAMES[parts[0]] || parts[0];
    const last = parts[parts.length - 1];
    return { first, last, key: `${first}|${last}` };
  }

  function namesLikelyMatch(left, right) {
    const a = normalizePersonName(left);
    const b = normalizePersonName(right);
    if (!a.last || !b.last || a.last !== b.last) return false;
    if (a.first === b.first) return true;
    return a.first[0] && a.first[0] === b.first[0] && (a.first.length === 1 || b.first.length === 1);
  }

  function parseDate(value, fallbackYear) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const raw = String(value || "").trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [year, month, day] = raw.slice(0, 10).split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    const numeric = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (numeric) {
      let year = numeric[3] ? Number(numeric[3]) : Number(fallbackYear);
      if (year < 100) year += 2000;
      return new Date(year, Number(numeric[1]) - 1, Number(numeric[2]));
    }
    const named = normalizeText(raw).match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
    if (named && Object.prototype.hasOwnProperty.call(MONTH_MAP, named[1])) {
      return new Date(Number(named[3] || fallbackYear), MONTH_MAP[named[1]], Number(named[2]));
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  function formatISODate(date) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addMonths(date, amount) {
    const copy = new Date(date.getTime());
    copy.setMonth(copy.getMonth() + amount);
    return copy;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseTime(value) {
    const match = String(value || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const meridiem = (match[3] || "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (!meridiem && hour < 8) hour += 12;
    return hour * 60 + minute;
  }

  function dayCodeForDate(date) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  }

  function parseLineNumber(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function detectTherapists(note) {
    const normalized = normalizeText(note);
    return THERAPIST_PATTERNS
      .filter(([, pattern]) => pattern.test(normalized))
      .map(([name]) => name);
  }

  function detectDays(note) {
    const normalized = normalizeText(note);
    const days = new Set();
    Object.entries(DAY_MAP).forEach(([token, code]) => {
      if (new RegExp(`\\b${token}\\b`, "i").test(normalized)) days.add(code);
    });
    if (/\b(?:weekdays?|wkdays?)\b/.test(normalized)) ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((day) => days.add(day));
    return days;
  }

  function timeFromPhrase(note, pattern) {
    const match = normalizeText(note).match(pattern);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    let total = hour * 60 + minute;
    if (hour < 8) total += 12 * 60;
    return total;
  }

  function preferenceDefaults() {
    return {
      allowedTherapists: null,
      excludedTherapists: new Set(),
      durations: null,
      allowedDays: null,
      excludedDays: new Set(),
      minStart: null,
      maxStart: null,
      maxEnd: null,
      minNoticeMinutes: 120,
      requirePreviousDay: false,
      contactPreference: "call",
      activeFrom: null,
      flags: [],
    };
  }

  function applyPreferenceNote(preferences, rawNote, asOfYear) {
    const note = normalizeText(rawNote);
    if (!note) return;

    if (/text (?:dont|do not) call|text only/.test(note)) preferences.contactPreference = "text";
    if (/landline/.test(note)) preferences.contactPreference = "landline";

    if (/pregnan/.test(note)) {
      preferences.allowedTherapists = new Set(["Amira Haddad", "Kelsey Babineau"]);
      preferences.flags.push("Prenatal clinic rule applied");
    } else if (/female only|any female/.test(note)) {
      preferences.allowedTherapists = new Set(FEMALE_THERAPISTS);
    } else {
      const detected = detectTherapists(note);
      const explicitPositive = detected.filter((name) => {
        const first = normalizeText(name).split(" ")[0];
        const negative = new RegExp(`(?:not|but|ab)\\s+${first}|anyone but ${first}`).test(note);
        return !negative;
      });
      const hasPositiveContext = /\bonly\b|\bor\b|\bpref\b|\bstill\b|\bok now\b|\bany\b/.test(note) || explicitPositive.length >= 2;
      if (explicitPositive.length && hasPositiveContext && !/anyone but|\bab\s/.test(note)) {
        preferences.allowedTherapists = new Set(explicitPositive);
      }
    }

    if (/anyone but dave|any but dave|\bab dave\b/.test(note)) preferences.excludedTherapists.add("Dave Melanson");
    if (/not marc/.test(note)) preferences.excludedTherapists.add("Marc Cormier");

    const durationSet = new Set();
    if (/\b90\b/.test(note)) durationSet.add(90);
    if (/\b60\b|\b1\s*hr\b|\b1\s*hour\b/.test(note)) durationSet.add(60);
    if (/\b45\b/.test(note)) durationSet.add(45);
    if (/30\s*(?:or|\/)\s*45|45\s*(?:or|\/)\s*30|(?:any|only|massage|appointment)\s+30|30\s+only/.test(note)) durationSet.add(30);
    if (durationSet.size) preferences.durations = durationSet;

    const days = detectDays(note);
    const hasPositiveDayList = days.size && !/^not\s/.test(note) && (
      days.size >= 2 ||
      /\bonly\b|\bweekdays?\b|\b(?:mon|tue|tues|wed|fri|sat)\s*(?:or|\/)|(?:or|\/)\s*(?:mon|tue|tues|wed|fri|sat)/.test(note)
    );
    if (hasPositiveDayList) preferences.allowedDays = days;
    Object.entries(DAY_MAP).forEach(([token, code]) => {
      if (new RegExp(`\\bnot\\s+${token}\\b`).test(note)) preferences.excludedDays.add(code);
    });

    if (/\bam\b|\bmornings?\b/.test(note)) preferences.maxStart = 11 * 60 + 59;
    if (/\bafternoons?\b/.test(note)) preferences.minStart = 12 * 60;
    if (/\bevenings?\b/.test(note)) preferences.minStart = Math.max(preferences.minStart || 0, 17 * 60);

    const notBefore = timeFromPhrase(note, /not before (\d{1,2})(?: (\d{2}))?/);
    const after = timeFromPhrase(note, /(?:after|from) (\d{1,2})(?: (\d{2}))?/);
    if (notBefore != null) preferences.minStart = notBefore;
    if (after != null) preferences.minStart = after;

    const finishedBy = timeFromPhrase(note, /(?:done|finished) by (\d{1,2})(?: (\d{2}))?/);
    if (finishedBy != null) preferences.maxEnd = finishedBy;

    if (/lunch/.test(note) && /12\s*(?:to|-)?\s*1/.test(note)) {
      preferences.minStart = 12 * 60;
      preferences.maxEnd = 13 * 60;
    }

    if (/same day ok/.test(note)) preferences.minNoticeMinutes = 0;
    const noticeRange = note.match(/(?:needs?|notice|come in|in)\s*(\d+)\s*(?:to|-)\s*(\d+)\s*(?:h|hr|hrs|hour|hours)/);
    const noticeHours = note.match(/(?:needs?|notice|come in|in)\s*(\d+)\s*(?:h|hr|hrs|hour|hours)/);
    const noticeMinutes = note.match(/(\d+)\s*(?:min|mins|minute|minutes)\s*(?:notice|ok|away)?/);
    if (noticeRange) preferences.minNoticeMinutes = Number(noticeRange[2]) * 60;
    else if (noticeHours && !/\b1\s*hr\b.*(?:massage|appointment)/.test(note)) preferences.minNoticeMinutes = Number(noticeHours[1]) * 60;
    if (noticeMinutes && /notice|can come|across|retired|away/.test(note)) preferences.minNoticeMinutes = Number(noticeMinutes[1]);
    if (/day before|next day only/.test(note)) preferences.requirePreviousDay = true;

    const backDate = note.match(/(?:back|from)\s+(?:now\s+)?(?:til|until)?\s*(oct|nov|dec|sep|sept|aug|jul)\s*(\d{1,2})/);
    if (backDate) preferences.activeFrom = new Date(asOfYear, MONTH_MAP[backDate[1]], Number(backDate[2]) + (/\btil|until\b/.test(note) ? 1 : 0));
  }

  function chooseDisplayName(rows) {
    return rows
      .map((row) => String(row.name || "").trim())
      .sort((a, b) => normalizeText(b).length - normalizeText(a).length)[0] || "Unknown";
  }

  function groupWaitlistRows(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      const phone = normalizePhone(row.phone);
      const nameParts = normalizePersonName(row.name);
      let key = phone || nameParts.key || `line-${row.line}`;
      if (!phone && /same\s*#/i.test(String(row.phone || ""))) {
        const priorKey = Array.from(groups.keys()).find((candidateKey) => {
          const group = groups.get(candidateKey);
          const prior = normalizePersonName(chooseDisplayName(group));
          return prior.first === nameParts.first && prior.last[0] && prior.last[0] === nameParts.last[0];
        });
        if (priorKey) key = priorKey;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.values()).map((group) => group.sort((a, b) => parseLineNumber(a.line) - parseLineNumber(b.line)));
  }

  function explicitStaleReason(rows, asOfDate) {
    const combined = normalizeText(rows.map((row) => row.notes).join(" "));
    if (/number not in service|not in service/.test(combined)) return "Phone number is marked out of service";
    if (/moved to|moved away|moved to hfx|moved to halifax/.test(combined)) return "Person is marked as moved away";
    if (/going to someone|found another|take off/.test(combined)) return "Person is marked as no longer waiting";
    if (/only til end of sept|only until end of sept/.test(combined) && asOfDate > new Date(asOfDate.getFullYear(), 8, 30)) return "Request expired at the end of September";
    const wedding = combined.match(/wedding (?:is )?(?:sat )?(?:the )?(\d{1,2})(?:st|nd|rd|th)?/);
    if (/before wedding/.test(combined) && wedding && asOfDate > new Date(asOfDate.getFullYear(), 9, Number(wedding[1]))) return "Requested date has passed";
    const hereUntil = combined.match(/here til (oct|nov|dec|sep|sept) (\d{1,2})/);
    if (hereUntil && asOfDate > new Date(asOfDate.getFullYear(), MONTH_MAP[hereUntil[1]], Number(hereUntil[2]))) return "Availability end date has passed";
    return "";
  }

  function bookedSinceLatestRequest(personRows, appointments, latestAdded) {
    if (!latestAdded) return false;
    const combinedNotes = normalizeText(personRows.map((row) => row.notes).join(" "));
    if (/wants? an extra|extra appointment/.test(combinedNotes)) return false;
    const names = personRows.map((row) => row.name);
    return appointments.some((appointment) => {
      if (String(appointment.status || "").toLowerCase() !== "completed") return false;
      const appointmentDate = parseDate(appointment.date, latestAdded.getFullYear());
      if (!appointmentDate || appointmentDate < latestAdded) return false;
      return names.some((name) => namesLikelyMatch(name, appointment.client_name));
    });
  }

  function prepareWaitlist(waitlistRows, appointments, asOfInput) {
    const asOfDate = startOfDay(parseDate(asOfInput, new Date().getFullYear()) || new Date());
    const groups = groupWaitlistRows(waitlistRows);
    const people = [];
    const audit = [];

    groups.forEach((rows) => {
      const latest = rows[rows.length - 1];
      const latestAdded = parseDate(latest.added, asOfDate.getFullYear());
      const displayName = chooseDisplayName(rows);
      const lineNumber = parseLineNumber(latest.line);
      const lineId = `W${String(lineNumber).padStart(2, "0")}`;
      let staleReason = explicitStaleReason(rows, asOfDate);

      if (!staleReason && latestAdded && addMonths(latestAdded, 2) < asOfDate) {
        staleReason = "No renewed request in more than two months";
      }
      if (!staleReason && bookedSinceLatestRequest(rows, appointments, latestAdded)) {
        staleReason = "Completed an appointment after joining the waitlist";
      }

      const preferences = preferenceDefaults();
      rows.forEach((row) => applyPreferenceNote(preferences, row.notes, asOfDate.getFullYear()));
      if (latestAdded && /\bback now\b/.test(normalizeText(latest.notes))) {
        preferences.activeFrom = new Date(latestAdded.getFullYear(), latestAdded.getMonth(), latestAdded.getDate() + 1);
      }
      if (!preferences.durations) preferences.durations = new Set([60]);

      const person = {
        key: normalizePhone(latest.phone) || normalizePersonName(displayName).key,
        lineNumber,
        lineId,
        sourceLines: rows.map((row) => `W${String(parseLineNumber(row.line)).padStart(2, "0")}`),
        name: displayName,
        phone: latest.phone || rows[0].phone || "",
        added: latestAdded,
        active: !staleReason,
        staleReason,
        preferences,
      };
      people.push(person);
      audit.push({
        line_id: lineId,
        name: displayName,
        status: person.active ? "active" : "stale",
        reason: staleReason || (rows.length > 1 ? `Newest of ${rows.length} entries used` : "Current entry"),
        source_lines: person.sourceLines.join("; "),
      });
    });

    people.sort((a, b) => a.lineNumber - b.lineNumber);
    return { people, audit, asOfDate };
  }

  function therapistAllowed(person, therapist) {
    const preferences = person.preferences;
    if (preferences.excludedTherapists.has(therapist)) return false;
    if (preferences.allowedTherapists && !preferences.allowedTherapists.has(therapist)) return false;
    return true;
  }

  function selectDuration(person, openingLength, startMinutes) {
    const preferences = person.preferences;
    const choices = Array.from(preferences.durations)
      .filter((duration) => duration <= openingLength)
      .sort((a, b) => b - a);
    return choices.find((duration) => {
      if (preferences.minStart != null && startMinutes < preferences.minStart) return false;
      if (preferences.maxStart != null && startMinutes > preferences.maxStart) return false;
      if (preferences.maxEnd != null && startMinutes + duration > preferences.maxEnd) return false;
      return true;
    }) || null;
  }

  function matchPersonToOpening(person, opening) {
    if (!person.active) return { matched: false, reason: person.staleReason || "Inactive" };
    const openingDate = parseDate(opening.date, new Date().getFullYear());
    const startMinutes = parseTime(opening.start);
    const openingLength = Number(opening.length_min);
    const noticeMinutes = Number(opening.hours_notice) * 60;
    const therapist = String(opening.therapist || "").trim();
    const day = String(opening.day || "").trim() || (openingDate ? dayCodeForDate(openingDate) : "");
    const preferences = person.preferences;

    if (!openingDate || startMinutes == null || !Number.isFinite(openingLength)) return { matched: false, reason: "Opening is missing required information" };
    if (!therapistAllowed(person, therapist)) return { matched: false, reason: "Therapist does not fit" };
    if (preferences.allowedDays && !preferences.allowedDays.has(day)) return { matched: false, reason: "Day does not fit" };
    if (preferences.excludedDays.has(day)) return { matched: false, reason: "Day is excluded" };
    if (preferences.activeFrom && openingDate < preferences.activeFrom) return { matched: false, reason: "Availability had not started" };
    if (Number.isFinite(noticeMinutes) && noticeMinutes + 0.01 < preferences.minNoticeMinutes) return { matched: false, reason: "Not enough notice" };

    if (preferences.requirePreviousDay) {
      const cancelledAt = new Date(String(opening.cancelled_at || "").replace(" ", "T"));
      if (Number.isNaN(cancelledAt.getTime()) || startOfDay(cancelledAt) >= startOfDay(openingDate)) {
        return { matched: false, reason: "Needs notice on the previous day" };
      }
    }

    const duration = selectDuration(person, openingLength, startMinutes);
    if (!duration) return { matched: false, reason: "Time or length does not fit" };

    const therapistFirst = therapist.split(" ")[0];
    const contact = preferences.contactPreference === "text" ? "text preferred" : preferences.contactPreference === "landline" ? "landline" : "call";
    return {
      matched: true,
      duration,
      reason: `${therapistFirst} · ${duration} min · ${contact}`,
    };
  }

  function matchOpenings(openings, prepared, limit) {
    const maxCandidates = limit == null ? 3 : Number(limit);
    return openings.map((opening) => {
      const kind = normalizeText(opening.kind);
      if (kind === "no show") {
        return {
          opening,
          candidates: [],
          result: "Nobody",
          resultReason: "No-show: the opening is known only after the appointment has started",
          decisionTrace: {
            activePeople: prepared.people.filter((person) => person.active).length,
            suitablePeople: 0,
            shownPeople: 0,
            notEvaluatedReason: "No-show: matching starts only after the appointment has already begun",
            excluded: {},
          },
        };
      }

      const allCandidates = [];
      const excluded = {};
      for (const person of prepared.people) {
        const match = matchPersonToOpening(person, opening);
        if (match.matched) {
          allCandidates.push({
            lineId: person.lineId,
            name: person.name,
            phone: person.phone,
            contactPreference: person.preferences.contactPreference,
            duration: match.duration,
            reason: match.reason,
          });
        } else if (person.active) {
          excluded[match.reason] = (excluded[match.reason] || 0) + 1;
        }
      }
      const candidates = allCandidates.slice(0, maxCandidates);

      return {
        opening,
        candidates,
        result: candidates.length ? `${candidates.length} match${candidates.length === 1 ? "" : "es"}` : "Nobody",
        resultReason: candidates.length ? "" : "No active waitlist person safely fits every known rule",
        decisionTrace: {
          activePeople: prepared.people.filter((person) => person.active).length,
          suitablePeople: allCandidates.length,
          shownPeople: candidates.length,
          excluded,
        },
      };
    });
  }

  function runMatcher({ appointments, waitlist, openings, asOfDate, limit = 3 }) {
    const prepared = prepareWaitlist(waitlist, appointments, asOfDate);
    const results = matchOpenings(openings, prepared, limit);
    return {
      asOfDate: prepared.asOfDate,
      people: prepared.people,
      audit: prepared.audit,
      results,
      summary: {
        openings: results.length,
        activePeople: prepared.people.filter((person) => person.active).length,
        stalePeople: prepared.people.filter((person) => !person.active).length,
        matchedOpenings: results.filter((result) => result.candidates.length).length,
        nobodyOpenings: results.filter((result) => !result.candidates.length).length,
      },
    };
  }

  function flattenResults(results) {
    return results.map((entry) => {
      const row = {
        opening_id: entry.opening.opening_id,
        date: entry.opening.date,
        start: entry.opening.start,
        length_min: entry.opening.length_min,
        therapist: entry.opening.therapist,
        kind: entry.opening.kind,
        result: entry.result,
        reason: entry.resultReason,
        suitable_people: entry.decisionTrace ? entry.decisionTrace.suitablePeople : entry.candidates.length,
      };
      for (let index = 0; index < 3; index += 1) {
        const candidate = entry.candidates[index];
        const number = index + 1;
        row[`candidate_${number}_line`] = candidate ? candidate.lineId : "";
        row[`candidate_${number}_name`] = candidate ? candidate.name : "";
        row[`candidate_${number}_phone`] = candidate ? candidate.phone : "";
        row[`candidate_${number}_reason`] = candidate ? candidate.reason : "";
      }
      return row;
    });
  }

  function requiredColumnsPresent(rows, required) {
    if (!rows.length) return { ok: false, missing: required.slice() };
    const columns = new Set(Object.keys(rows[0]));
    const missing = required.filter((column) => !columns.has(column));
    return { ok: missing.length === 0, missing };
  }

  return {
    THERAPISTS,
    parseCSV,
    toCSV,
    parseDate,
    formatISODate,
    normalizeText,
    normalizePhone,
    prepareWaitlist,
    matchPersonToOpening,
    matchOpenings,
    runMatcher,
    flattenResults,
    requiredColumnsPresent,
  };
});

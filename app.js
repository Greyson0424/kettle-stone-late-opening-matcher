(function () {
  "use strict";

  const Matcher = window.KettleStoneMatcher;
  const state = {
    appointments: [],
    waitlist: [],
    openings: [],
    run: null,
    fileNames: {},
  };

  const required = {
    appointments: ["appointment_id", "date", "status", "client_name"],
    waitlist: ["line", "added", "name", "phone", "notes"],
    openings: ["opening_id", "date", "start", "length_min", "therapist", "kind", "hours_notice"],
  };

  const elements = {
    appointmentsFile: document.getElementById("appointments-file"),
    waitlistFile: document.getElementById("waitlist-file"),
    openingsFile: document.getElementById("openings-file"),
    runDate: document.getElementById("run-date"),
    runButton: document.getElementById("run-button"),
    message: document.getElementById("message"),
    resultsSection: document.getElementById("results-section"),
    resultsBody: document.getElementById("results-body"),
    auditBody: document.getElementById("audit-body"),
    summaryGrid: document.getElementById("summary-grid"),
    detailPanel: document.getElementById("detail-panel"),
    downloadResults: document.getElementById("download-results"),
    downloadAudit: document.getElementById("download-audit"),
    singleForm: document.getElementById("single-form"),
    singleTherapist: document.getElementById("single-therapist"),
  };

  Matcher.THERAPISTS.forEach((therapist) => {
    const option = document.createElement("option");
    option.value = therapist;
    option.textContent = therapist;
    elements.singleTherapist.appendChild(option);
  });

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(text, type) {
    elements.message.textContent = text;
    elements.message.className = `message${type === "success" ? " success" : ""}`;
    elements.message.hidden = false;
  }

  function clearMessage() {
    elements.message.hidden = true;
    elements.message.textContent = "";
  }

  function dateFromFilename(name) {
    const matches = String(name || "").match(/(20\d{2})-(\d{2})-(\d{2})/g);
    return matches && matches.length ? matches[matches.length - 1] : "";
  }

  async function readFile(kind, file) {
    clearMessage();
    const text = await file.text();
    const rows = Matcher.parseCSV(text);
    const check = Matcher.requiredColumnsPresent(rows, required[kind]);
    const label = document.getElementById(`${kind}-name`);
    const status = document.getElementById(`${kind}-state`);

    label.textContent = file.name;
    if (!check.ok) {
      state[kind] = [];
      status.textContent = `Missing: ${check.missing.join(", ")}`;
      status.className = "file-state error";
      showMessage(`${file.name} cannot be used because required columns are missing.`, "error");
      return;
    }

    state[kind] = rows;
    state.fileNames[kind] = file.name;
    status.textContent = `✓ ${rows.length} rows read`;
    status.className = "file-state ready";
    if (kind === "waitlist") {
      const detected = dateFromFilename(file.name);
      if (detected) elements.runDate.value = detected;
    }
  }

  elements.appointmentsFile.addEventListener("change", (event) => event.target.files[0] && readFile("appointments", event.target.files[0]));
  elements.waitlistFile.addEventListener("change", (event) => event.target.files[0] && readFile("waitlist", event.target.files[0]));
  elements.openingsFile.addEventListener("change", (event) => event.target.files[0] && readFile("openings", event.target.files[0]));

  function candidateCell(candidate) {
    if (!candidate) return '<span class="candidate-meta">—</span>';
    return `<div class="candidate-name">${escapeHTML(candidate.name)}</div>
      <div class="candidate-meta">${escapeHTML(candidate.lineId)} · ${escapeHTML(candidate.reason)}</div>`;
  }

  function renderSummary(summary) {
    const items = [
      ["Openings checked", summary.openings],
      ["With matches", summary.matchedOpenings],
      ["Active people", summary.activePeople],
      ["Out of date", summary.stalePeople],
    ];
    elements.summaryGrid.innerHTML = items.map(([label, value]) => `
      <span class="summary-item"><strong>${escapeHTML(value)}</strong>${escapeHTML(label)}</span>`).join("");
  }

  function renderResults(results) {
    elements.resultsBody.innerHTML = results.map((entry, index) => {
      const opening = entry.opening;
      return `<tr>
        <td><div class="opening-main">${escapeHTML(opening.opening_id || "Opening")}</div>
          <div class="opening-meta">${escapeHTML(opening.date)} · ${escapeHTML(opening.start)} · ${escapeHTML(opening.therapist)} · ${escapeHTML(opening.length_min)} min</div></td>
        <td>${candidateCell(entry.candidates[0])}</td>
        <td>${candidateCell(entry.candidates[1])}</td>
        <td>${candidateCell(entry.candidates[2])}</td>
        <td><div class="candidate-meta">${escapeHTML(entry.result)}</div><button class="why-button" type="button" data-result-index="${index}">View decision</button></td>
      </tr>`;
    }).join("");

    elements.resultsBody.querySelectorAll("[data-result-index]").forEach((button) => {
      button.addEventListener("click", () => showDetail(results[Number(button.dataset.resultIndex)]));
    });
  }

  function renderAudit(audit) {
    elements.auditBody.innerHTML = audit.map((row) => `
      <tr>
        <td>${escapeHTML(row.line_id)}</td>
        <td>${escapeHTML(row.name)}</td>
        <td class="${row.status === "active" ? "audit-active" : "audit-stale"}">${escapeHTML(row.status)}</td>
        <td>${escapeHTML(row.reason)}</td>
        <td>${escapeHTML(row.source_lines)}</td>
      </tr>`).join("");
  }

  function showDetail(entry) {
    const opening = entry.opening;
    const trace = entry.decisionTrace || { activePeople: 0, suitablePeople: entry.candidates.length, shownPeople: entry.candidates.length, excluded: {} };
    const reasonNames = {
      "Therapist does not fit": "Therapist",
      "Day does not fit": "Day",
      "Day is excluded": "Day",
      "Availability had not started": "Availability date",
      "Not enough notice": "Notice",
      "Needs notice on the previous day": "Notice",
      "Time or length does not fit": "Time or length",
      "Opening is missing required information": "Missing information",
    };
    const groupedReasons = {};
    Object.entries(trace.excluded || {}).forEach(([reason, count]) => {
      const label = reasonNames[reason] || reason;
      groupedReasons[label] = (groupedReasons[label] || 0) + count;
    });
    const reasonHTML = Object.entries(groupedReasons)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => `<span><strong>${escapeHTML(count)}</strong> removed for ${escapeHTML(label.toLowerCase())}</span>`)
      .join("");
    const cards = entry.candidates.length
      ? `<div class="detail-grid">${entry.candidates.map((candidate, index) => `
          <div class="detail-candidate">
            <strong>${index + 1}. ${escapeHTML(candidate.name)}</strong>
            <span>${escapeHTML(candidate.lineId)} · ${escapeHTML(candidate.phone)}</span>
            <span>${escapeHTML(candidate.reason)}</span>
          </div>`).join("")}</div>`
      : `<div class="nobody-box"><strong>Nobody</strong><br>${escapeHTML(entry.resultReason)}</div>`;
    const traceHTML = trace.notEvaluatedReason
      ? `<div class="decision-trace"><h4>How it decided</h4><div class="nobody-box">${escapeHTML(trace.notEvaluatedReason)}</div></div>`
      : `<div class="decision-trace">
          <h4>How it decided</h4>
          <div class="trace-flow">
            <span class="trace-step"><strong>${escapeHTML(trace.activePeople)}</strong> active people</span>
            <span class="trace-arrow" aria-hidden="true">→</span>
            <span class="trace-step"><strong>${escapeHTML(trace.suitablePeople)}</strong> passed every rule</span>
            <span class="trace-arrow" aria-hidden="true">→</span>
            <span class="trace-step"><strong>${escapeHTML(trace.shownPeople)}</strong> shown</span>
          </div>
          <div class="trace-reasons">${reasonHTML || "No active person was excluded."}</div>
        </div>`;
    elements.detailPanel.innerHTML = `
      <h3>${escapeHTML(opening.opening_id || "Opening")} · ${escapeHTML(opening.date)} at ${escapeHTML(opening.start)}</h3>
      <p>${escapeHTML(opening.therapist)} · ${escapeHTML(opening.length_min)} minutes · ${escapeHTML(opening.hours_notice)} hours of notice</p>
      ${cards}
      ${traceHTML}`;
    elements.detailPanel.hidden = false;
    elements.detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderRun(run) {
    state.run = run;
    renderSummary(run.summary);
    renderResults(run.results);
    renderAudit(run.audit);
    elements.resultsSection.hidden = false;
    elements.detailPanel.hidden = true;
    showMessage(`Finished. ${run.summary.openings} openings checked using ${run.summary.activePeople} active people.`, "success");
    elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function ensureBaseFiles() {
    if (!state.appointments.length || !state.waitlist.length) {
      showMessage("Choose the booking export and waitlist first.", "error");
      return false;
    }
    if (!elements.runDate.value) {
      showMessage("Choose the run date shown on the waitlist file.", "error");
      return false;
    }
    return true;
  }

  elements.runButton.addEventListener("click", () => {
    if (!ensureBaseFiles()) return;
    if (!state.openings.length) {
      showMessage("Choose the late openings file for a batch run, or use Match one opening below.", "error");
      return;
    }
    renderRun(Matcher.runMatcher({
      appointments: state.appointments,
      waitlist: state.waitlist,
      openings: state.openings,
      asOfDate: elements.runDate.value,
    }));
  });

  elements.singleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!ensureBaseFiles()) return;
    const date = document.getElementById("single-date").value;
    const start = document.getElementById("single-start").value;
    if (!date || !start) {
      showMessage("Enter the opening date and start time.", "error");
      return;
    }
    const notice = Number(document.getElementById("single-notice").value);
    const startDate = new Date(`${date}T${start}:00`);
    const cancelledAt = new Date(startDate.getTime() - notice * 60 * 60 * 1000);
    const opening = {
      opening_id: "Desk opening",
      date,
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][startDate.getDay()],
      start,
      length_min: document.getElementById("single-length").value,
      therapist: elements.singleTherapist.value,
      kind: document.getElementById("single-kind").value,
      hours_notice: String(notice),
      cancelled_at: `${Matcher.formatISODate(cancelledAt)} ${String(cancelledAt.getHours()).padStart(2, "0")}:${String(cancelledAt.getMinutes()).padStart(2, "0")}`,
    };
    renderRun(Matcher.runMatcher({
      appointments: state.appointments,
      waitlist: state.waitlist,
      openings: [opening],
      asOfDate: elements.runDate.value,
    }));
  });

  function download(name, content, type) {
    const blob = new Blob([content], { type: type || "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  elements.downloadResults.addEventListener("click", () => {
    if (!state.run) return;
    const rows = Matcher.flattenResults(state.run.results);
    const headers = Object.keys(rows[0] || {});
    download(`late-opening-matches-${Matcher.formatISODate(state.run.asOfDate)}.csv`, Matcher.toCSV(rows, headers));
  });

  elements.downloadAudit.addEventListener("click", () => {
    if (!state.run) return;
    const headers = ["line_id", "name", "status", "reason", "source_lines"];
    download(`waitlist-audit-${Matcher.formatISODate(state.run.asOfDate)}.csv`, Matcher.toCSV(state.run.audit, headers));
  });

  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll('[role="tab"]').forEach((peer) => {
        const selected = peer === tab;
        peer.classList.toggle("active", selected);
        peer.setAttribute("aria-selected", String(selected));
        document.getElementById(peer.getAttribute("aria-controls")).hidden = !selected;
      });
    });
  });
})();

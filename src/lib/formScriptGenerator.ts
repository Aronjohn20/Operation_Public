import { CSIEvent, RegisteredAttendee } from "./types";

/**
 * Maps branch abbreviations to departmental names
 */
export function getDepartmentChoices(targetBranches?: string[]): string[] {
  const branchMap: Record<string, string> = {
    AD: "AI&DS",
    CSE: "CSE",
    CSBS: "CSBS",
    IT: "IT",
    ME: "ME",
    CE: "CE",
    EEE: "EEE",
    ECE: "ECE",
    AEI: "AEI",
  };

  if (!targetBranches || targetBranches.length === 0) {
    return ["AI&DS", "CSBS", "CSE", "IT"];
  }

  const list = targetBranches.map((b) => branchMap[b] || b);
  return Array.from(new Set(list));
}

/**
 * Generates exact Google Apps Script matching the official Registration Form structure.
 * Automatically customizes Form Title and Department choices based on event parameters!
 */
export function generateEventGoogleAppsScript(event: CSIEvent): string {
  const deptChoices = getDepartmentChoices(event.target_branches);
  const deptChoicesJson = JSON.stringify(deptChoices);
  const cleanFuncName = `createForm_${event.id.replace(/[^a-zA-Z0-9]/g, "_")}`;

  return `/**
 * ============================================================================
 * TECHNICAL STUDENT SOCIETY - Automated Google Form & Responses Sheet Generator
 * Event: ${event.event_name}
 * ============================================================================
 * Instructions:
 * 1. Open Google Drive in your society account (https://drive.google.com).
 * 2. Go to https://script.google.com and click "+ New project".
 * 3. Delete any default code, paste this entire script, and click Save (💾).
 * 4. Click "Run". Grant permissions (Click Advanced > Go to project (unsafe) > Allow).
 * 5. Check the Execution Log below: It gives you the live Form Link & Sheet Link!
 * ============================================================================
 */

function ${cleanFuncName}() {
  const formTitle = "${event.event_name} Registration Form";

  // 1. Create Google Form
  const form = FormApp.create(formTitle);
  form.setLimitOneResponsePerUser(true);
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);
  form.setProgressBar(false);
  form.setShuffleQuestions(false);
  form.setShowLinkToRespondAgain(false);
  form.setPublishingSummary(false);

  // Q1: Title * (Multiple Choice: Mr, Ms)
  form.addMultipleChoiceItem()
    .setTitle("Title")
    .setChoiceValues(["Mr", "Ms"])
    .setRequired(true);

  // Q2: Name * (Short Answer)
  form.addTextItem()
    .setTitle("Name")
    .setRequired(true);

  // Q3: College Email ID * (Short Answer)
  form.addTextItem()
    .setTitle("College Email ID")
    .setRequired(true);

  // Q4: Contact No.(Preferably WhatsApp) * (Short Answer)
  form.addTextItem()
    .setTitle("Contact No.(Preferably WhatsApp)")
    .setRequired(true);

  // Q5: Year of study * (Multiple Choice: 1st, 2nd, 3rd, 4th year)
  form.addMultipleChoiceItem()
    .setTitle("Year of study")
    .setChoiceValues(["1st year", "2nd year", "3rd year", "4th year"])
    .setRequired(true);

  // Q6: Department * (Auto-filtered from event's selected eligible branches)
  form.addMultipleChoiceItem()
    .setTitle("Department")
    .setChoiceValues(${deptChoicesJson})
    .setRequired(true);

  // Q7: Division * (Multiple Choice: Alpha, Beta, Gamma, Delta, Nil)
  form.addMultipleChoiceItem()
    .setTitle("Division")
    .setChoiceValues(["Alpha", "Beta", "Gamma", "Delta", "Nil"])
    .setRequired(true);

  // Q8: Are you a CSI member? * (Multiple Choice: Yes, No)
  form.addMultipleChoiceItem()
    .setTitle("Are you a CSI member?")
    .setChoiceValues(["Yes", "No"])
    .setRequired(true);

  // Q9: If yes, enter CSI membership id (Optional)
  form.addTextItem()
    .setTitle("If yes, enter CSI membership id")
    .setHelpText("Your membership ID can be found in your membership card")
    .setRequired(false);

  // 2. Create the Destination Google Sheet in CSI Google Drive
  const sheetTitle = "${event.event_name} - Registrations (Responses)";
  const spreadsheet = SpreadsheetApp.create(sheetTitle);

  // 3. Link Form responses to this Google Sheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  const formUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();
  const sheetUrl = spreadsheet.getUrl();

  Logger.log("=================================================");
  Logger.log("✅ REGISTRATION SYSTEM CREATED FOR: ${event.event_name.toUpperCase()}");
  Logger.log("=================================================");
  Logger.log("1. Public Form Link (Send to students in RSMS notice):");
  Logger.log(formUrl);
  Logger.log("\\n2. Edit Form in Drive (Add custom description / header banner):");
  Logger.log(editUrl);
  Logger.log("\\n3. Responses Sheet Link (Connect back to Attendance Sheet):");
  Logger.log(sheetUrl);
  Logger.log("=================================================");
}
`;
}

/**
 * Intelligent Mapper from Google Form CSV/TSV response columns to Attendance Sheet format
 */
export function mapGoogleFormResponsesToAttendance(
  headers: string[],
  rows: string[][]
): RegisteredAttendee[] {
  // Normalize header strings by stripping quotes, asterisks, punctuation, extra spaces, and lowering case
  const normHeaders = headers.map((h) =>
    String(h || "")
      .replace(/[*_#"'`:]/g, "")
      .trim()
      .toLowerCase()
  );

  // Detect index of each question with resilient fuzzy matching
  const titleIdx = normHeaders.findIndex(
    (h) => h === "title" || h.includes("title") || h.startsWith("salutation")
  );

  let nameIdx = normHeaders.findIndex(
    (h) =>
      h === "name" ||
      h.includes("student name") ||
      h.includes("full name") ||
      h.includes("participant name") ||
      h.includes("name of") ||
      (h.includes("name") && !h.includes("event") && !h.includes("college") && !h.includes("dept") && !h.includes("faculty"))
  );

  // Resilient fallback if name column wasn't detected by header text
  if (nameIdx === -1) {
    if (titleIdx !== -1 && titleIdx + 1 < headers.length) {
      nameIdx = titleIdx + 1;
    } else if (normHeaders.length > 2) {
      // Common standard: [0: Timestamp, 1: Email or Title, 2: Name]
      nameIdx = 2;
    } else if (normHeaders.length > 1) {
      nameIdx = 1;
    } else if (normHeaders.length === 1) {
      nameIdx = 0;
    }
  }

  const yearIdx = normHeaders.findIndex(
    (h) => h.includes("year of study") || h.includes("year") || h.includes("sem")
  );
  const deptIdx = normHeaders.findIndex(
    (h) => h.includes("department") || h.includes("dept") || h.includes("branch")
  );
  const divIdx = normHeaders.findIndex(
    (h) => h.includes("division") || h.includes("section") || h.includes("sec") || h.includes("div")
  );
  const directClassIdx = normHeaders.findIndex(
    (h) => h.includes("class & batch") || h.includes("class") || h.includes("batch")
  );
  const directGenderIdx = normHeaders.findIndex(
    (h) => h.includes("gender") || h.includes("sex")
  );

  if (nameIdx === -1) {
    throw new Error("Could not locate the 'Name' column in the uploaded response sheet.");
  }

  const yearShorthand: Record<string, string> = {
    "1st year": "S1/S2",
    "1st": "S1/S2",
    "first year": "S1/S2",
    "1": "S1/S2",
    "2nd year": "S3/S4",
    "2nd": "S3/S4",
    "second year": "S3/S4",
    "2": "S3/S4",
    "3rd year": "S5/S6",
    "3rd": "S5/S6",
    "third year": "S5/S6",
    "3": "S5/S6",
    "4th year": "S7/S8",
    "4th": "S7/S8",
    "fourth year": "S7/S8",
    "4": "S7/S8",
  };

  const divisionShorthand: Record<string, string> = {
    alpha: "A",
    beta: "B",
    gamma: "C",
    delta: "D",
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    nil: "",
    none: "",
    na: "",
    "-": "",
  };

  const attendees: RegisteredAttendee[] = [];

  rows.forEach((row) => {
    const rawName = String(row[nameIdx] || "").trim();
    if (!rawName) return;

    // Determine Gender (from direct Gender column or Title: Mr -> Male, Ms -> Female)
    let gender = "";
    if (directGenderIdx !== -1 && row[directGenderIdx]) {
      const g = row[directGenderIdx].trim().toLowerCase();
      if (g.startsWith("m") && !g.startsWith("f")) gender = "Male";
      else if (g.startsWith("f")) gender = "Female";
      else gender = row[directGenderIdx].trim();
    } else if (titleIdx !== -1 && row[titleIdx]) {
      const t = row[titleIdx].trim().toLowerCase();
      if (t === "mr" || t === "mr." || t.startsWith("mr")) gender = "Male";
      else if (t === "ms" || t === "ms." || t === "mrs" || t.startsWith("ms")) gender = "Female";
    }

    // Determine Class & Batch (from Year + Department + Division, or direct Class column)
    let classBatch = "";
    if (directClassIdx !== -1 && row[directClassIdx]) {
      classBatch = row[directClassIdx].trim();
    } else {
      const rawDept = deptIdx !== -1 && row[deptIdx] ? row[deptIdx].trim() : "";
      const divRaw = divIdx !== -1 && row[divIdx] ? row[divIdx].trim().toLowerCase() : "";
      const div =
        divisionShorthand[divRaw] !== undefined
          ? divisionShorthand[divRaw]
          : divRaw && !["nil", "none", "na", "-"].includes(divRaw)
          ? divRaw.toUpperCase()
          : "";

      const yrRaw = yearIdx !== -1 && row[yearIdx] ? row[yearIdx].trim().toLowerCase() : "";
      const yr = yearShorthand[yrRaw] || (yrRaw ? row[yearIdx].trim() : "");

      const parts = [yr, rawDept, div].filter(Boolean);
      classBatch = parts.join(" ");
    }

    attendees.push({
      sl_no: attendees.length + 1,
      name: rawName,
      gender: gender,
      class_batch: classBatch,
    });
  });

  return attendees;
}

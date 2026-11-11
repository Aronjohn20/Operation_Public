/**
 * ============================================================================
 * TECHNICAL STUDENT SOCIETY - Automated Google Form & Responses Sheet Generator
 * ============================================================================
 * Instructions:
 * 1. Open Google Drive in your society account (https://drive.google.com).
 * 2. Go to Google Apps Script (https://script.google.com) and click "+ New project".
 * 3. Delete any default code, paste this entire script, and click Save (💾).
 * 4. Update EVENT_CONFIG below if running for a different event.
 * 5. Click "Run" (createRegistrationFormAndSheet).
 *    Grant Google permissions (Click Advanced > Go to project (unsafe) > Allow).
 * 6. Check the Execution Log: It outputs:
 *    - Public Form Link (RSMS Notice / Registration Link)
 *    - Edit Form Link (To add description / banner)
 *    - Responses Google Sheet Link (To sync with Attendance Sheet)
 * ============================================================================
 */

const EVENT_CONFIG = {
  eventName: "Off the Script",
  // Department options dynamically match the branches selected for the event:
  // e.g. ["AI&DS", "CSBS", "CSE", "IT"]
  targetDepartments: ["AI&DS", "CSBS", "CSE", "IT"],
};

function createRegistrationFormAndSheet() {
  const formTitle = `${EVENT_CONFIG.eventName} Registration Form`;

  // 1. Create Google Form
  const form = FormApp.create(formTitle);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(true);

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

  // Q5: Year of study * (Multiple Choice: 1st year, 2nd year, 3rd year, 4th year)
  form.addMultipleChoiceItem()
    .setTitle("Year of study")
    .setChoiceValues(["1st year", "2nd year", "3rd year", "4th year"])
    .setRequired(true);

  // Q6: Department * (Multiple Choice: Filtered by event target branches)
  form.addMultipleChoiceItem()
    .setTitle("Department")
    .setChoiceValues(EVENT_CONFIG.targetDepartments)
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

  // Q9: If yes, enter CSI membership id (Optional Short Answer)
  form.addTextItem()
    .setTitle("If yes, enter CSI membership id")
    .setHelpText("Your membership ID can be found in your membership card")
    .setRequired(false);

  // 2. Create Destination Google Sheet in CSI Google Drive
  const sheetTitle = `${EVENT_CONFIG.eventName} - Registrations (Responses)`;
  const spreadsheet = SpreadsheetApp.create(sheetTitle);

  // 3. Link Form responses to this Google Sheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  const formUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();
  const sheetUrl = spreadsheet.getUrl();

  Logger.log("=================================================");
  Logger.log(`✅ FORM CREATED FOR: ${EVENT_CONFIG.eventName.toUpperCase()}`);
  Logger.log("=================================================");
  Logger.log("1. Public Form Link (for RSMS Notice):");
  Logger.log(formUrl);
  Logger.log("\n2. Edit Form in Drive (add writeup & theme):");
  Logger.log(editUrl);
  Logger.log("\n3. Responses Sheet Link (paste into CSI Operations to map Attendance):");
  Logger.log(sheetUrl);
  Logger.log("=================================================");
}

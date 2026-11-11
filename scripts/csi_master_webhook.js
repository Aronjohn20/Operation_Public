/**
 * ============================================================================
 * TECHNICAL STUDENT SOCIETY - Master Automation Webhook
 * One-time deployment for all technical events:
 * Handles Registration Form, Feedback Form, Drive Linking, and Response Sync.
 * ============================================================================
 */

// Test endpoint to check if webhook is live
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", message: "Master Automation Webhook Hub is active." })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Handles requests from CSI Operations app
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "create_form";

    // -------------------------------------------------------------
    // ACTION 1: Create Registration Form & Linked Responses Sheet
    // -------------------------------------------------------------
    if (action === "create_form") {
      const eventName = data.eventName || "Technical Event";
      const targetDepts = data.targetDepartments && data.targetDepartments.length > 0
        ? data.targetDepartments
        : ["AI&DS", "CSBS", "CSE", "IT"];

      const formTitle = eventName + " Registration Form";
      const form = FormApp.create(formTitle);
      form.setCollectEmail(true);
      form.setAllowResponseEdits(false);
      form.setLimitOneResponsePerUser(true);

      // Q1: Title *
      form.addMultipleChoiceItem()
        .setTitle("Title")
        .setChoiceValues(["Mr", "Ms"])
        .setRequired(true);

      // Q2: Name *
      form.addTextItem()
        .setTitle("Name")
        .setRequired(true);

      // Q3: College Email ID *
      form.addTextItem()
        .setTitle("College Email ID")
        .setRequired(true);

      // Q4: Contact No.(Preferably WhatsApp) *
      form.addTextItem()
        .setTitle("Contact No.(Preferably WhatsApp)")
        .setRequired(true);

      // Q5: Year of study *
      form.addMultipleChoiceItem()
        .setTitle("Year of study")
        .setChoiceValues(["1st year", "2nd year", "3rd year", "4th year"])
        .setRequired(true);

      // Q6: Department *
      form.addMultipleChoiceItem()
        .setTitle("Department")
        .setChoiceValues(targetDepts)
        .setRequired(true);

      // Q7: Division *
      form.addMultipleChoiceItem()
        .setTitle("Division")
        .setChoiceValues(["Alpha", "Beta", "Gamma", "Delta", "Nil"])
        .setRequired(true);

      // Q8: Are you a CSI member? *
      form.addMultipleChoiceItem()
        .setTitle("Are you a CSI member?")
        .setChoiceValues(["Yes", "No"])
        .setRequired(true);

      // Q9: If yes, enter CSI membership id (Optional)
      form.addTextItem()
        .setTitle("If yes, enter CSI membership id")
        .setHelpText("Your membership ID can be found in your membership card")
        .setRequired(false);

      // Create Destination Responses Sheet
      const sheetTitle = eventName + " - Registrations (Responses)";
      const spreadsheet = SpreadsheetApp.create(sheetTitle);
      form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        formId: form.getId(),
        formUrl: form.getPublishedUrl(),
        editUrl: form.getEditUrl(),
        sheetUrl: spreadsheet.getUrl(),
        sheetId: spreadsheet.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 2: Create Feedback Form & Linked Responses Sheet
    // -------------------------------------------------------------
    if (action === "create_feedback_form") {
      const eventName = data.eventName || "CSI Event";
      const description = data.description || (eventName + " Feedback Survey");
      const targetDepts = data.targetDepartments && data.targetDepartments.length > 0
        ? data.targetDepartments
        : ["AI&DS", "CSBS", "CSE", "IT"];
      const questions = data.questions || [];

      const formTitle = eventName + " Feedback";
      const form = FormApp.create(formTitle);
      form.setDescription(description);
      form.setCollectEmail(true);
      form.setAllowResponseEdits(false);
      form.setLimitOneResponsePerUser(true);

      // SECTION 1: Standard Attendee Profile (First 2 Pages)
      // Q1: Name (As required in the certificate) *
      form.addTextItem()
        .setTitle("Name (As required in the certificate)")
        .setRequired(true);

      // Q2: UID *
      form.addTextItem()
        .setTitle("UID")
        .setRequired(true);

      // Q3: UID Email (if no then provide your personal email) *
      form.addTextItem()
        .setTitle("UID Email (if no then provide your personal email)")
        .setRequired(true);

      // Q4: Gender *
      form.addMultipleChoiceItem()
        .setTitle("Gender")
        .setChoiceValues(["Mr", "Mrs"])
        .setRequired(true);

      // Q5: Year of Study *
      form.addMultipleChoiceItem()
        .setTitle("Year of Study")
        .setChoiceValues(["1st", "2nd", "3rd", "4th"])
        .setRequired(true);

      // Q6: Branch *
      form.addMultipleChoiceItem()
        .setTitle("Branch")
        .setChoiceValues(targetDepts)
        .setRequired(true);

      // Q7: Section *
      form.addMultipleChoiceItem()
        .setTitle("Section")
        .setChoiceValues(["Alpha", "Beta", "Gamma", "Delta", "Nil"])
        .setRequired(true);

      // Q8: WhatsApp No *
      form.addTextItem()
        .setTitle("WhatsApp No")
        .setRequired(true);

      // SECTION 2: Event-Specific CO/PO Evaluation
      const sectionBreak = form.addPageBreakItem();
      sectionBreak.setTitle("FEEDBACK FORM");
      sectionBreak.setHelpText("Please evaluate the following criteria based on your experience.");

      if (questions && questions.length > 0) {
        questions.forEach(function(q) {
          if (q.type === "paragraph") {
            form.addParagraphTextItem()
              .setTitle(q.title)
              .setHelpText(q.description || "")
              .setRequired(q.required !== false);
          } else {
            form.addMultipleChoiceItem()
              .setTitle(q.title)
              .setHelpText(q.description || "")
              .setChoiceValues(["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"])
              .setRequired(q.required !== false);
          }
        });
      }

      // Create Destination Responses Sheet
      const sheetTitle = eventName + " - Feedback (Responses)";
      const spreadsheet = SpreadsheetApp.create(sheetTitle);
      form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        formId: form.getId(),
        formUrl: form.getPublishedUrl(),
        editUrl: form.getEditUrl(),
        sheetUrl: spreadsheet.getUrl(),
        sheetId: spreadsheet.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 3: Fetch Responses from Linked Sheet
    // -------------------------------------------------------------
    if (action === "get_responses" || action === "get_feedback_responses") {
      const sheetId = data.sheetId;
      if (!sheetId) throw new Error("No sheetId provided.");

      const ss = SpreadsheetApp.openById(sheetId);
      const sheet = ss.getSheets()[0];
      const values = sheet.getDataRange().getValues();

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        headers: values[0] || [],
        rows: values.slice(1) || []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 4: Close / Reopen Form
    // -------------------------------------------------------------
    if (action === "close_form") {
      const formId = data.formId;
      const acceptResponses = data.acceptResponses === true;
      if (!formId) throw new Error("No formId provided.");

      const form = FormApp.openById(formId);
      form.setAcceptingResponses(acceptResponses);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        isAccepting: acceptResponses,
        message: acceptResponses ? "Form is now open for responses." : "Form has been closed for responses."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Unknown action requested.");

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

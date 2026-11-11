import { NextResponse } from "next/server";

// ============================================================================
// CSI Operations - Mock Google Form & Drive API (Sandbox Mode)
// ============================================================================
// In Demo / Public Sandbox mode:
// 1. Webhook connections to external Google Apps Scripts are completely severed.
// 2. No forms, spreadsheets, or Drive files are created in any real Google account.
// 3. Instant simulated responses are returned directly to the browser, allowing
//    visitors to test form generation, QR codes, attendance sync, and feedback workflows
//    without needing Google account access or exposing any club credentials.
// ============================================================================

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const action = payload.action || "";
    const eventName = payload.eventName || "Demo Event";

    // Small realistic delay (300ms) for smooth UI spinner feedback
    await new Promise((res) => setTimeout(res, 300));

    // 1. Create Registration Form Simulation
    if (action === "create_form") {
      const slug = eventName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 25);
      return NextResponse.json({
        success: true,
        formUrl: `https://forms.google.com/demo-${slug}-registration`,
        editUrl: `https://docs.google.com/forms/d/demo-${slug}-edit/edit`,
        formId: `demo-form-reg-${Date.now()}`,
        sheetUrl: `https://docs.google.com/spreadsheets/d/demo-${slug}-registrations-sheet/edit`,
        sheetId: `demo-sheet-reg-${Date.now()}`,
      });
    }

    // 2. Create Feedback Form Simulation
    if (action === "create_feedback_form") {
      const slug = eventName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 25);
      return NextResponse.json({
        success: true,
        formUrl: `https://forms.google.com/demo-${slug}-feedback`,
        editUrl: `https://docs.google.com/forms/d/demo-${slug}-feedback-edit/edit`,
        formId: `demo-form-feed-${Date.now()}`,
        sheetUrl: `https://docs.google.com/spreadsheets/d/demo-${slug}-feedback-responses-sheet/edit`,
        sheetId: `demo-sheet-feed-${Date.now()}`,
      });
    }

    // 3. Toggle Form Status (Close / Reopen) Simulation
    if (action === "close_form") {
      return NextResponse.json({
        success: true,
        message: "Form response acceptance status updated successfully (Simulated Sandbox).",
      });
    }

    // 4. Fetch Sheet Responses Simulation
    if (action === "get_responses" || action === "get_feedback_responses") {
      // Return realistic student rows for demonstration
      const sheetId = String(payload.sheetId || "");
      const isFeedback = action === "get_feedback_responses" || sheetId.includes("feed") || sheetId.includes("feedback");

      if (isFeedback) {
        return NextResponse.json({
          success: true,
          headers: [
            "Timestamp",
            "Name (As required in the certificate)",
            "UID",
            "UID Email",
            "Gender",
            "Year of Study",
            "Branch",
            "Section",
            "WhatsApp No",
            "Rate overall event quality (PO10)",
            "Rate organization & relevance (PO11)",
            "Comments / Suggestions",
          ],
          rows: [
            ["2026-09-25 16:30:10", "Aarav Sharma", "U230101", "aarav.s@example.com", "Mr", "3rd", "CSE", "Alpha", "9847000001", "5", "5", "Outstanding technical initiative!"],
            ["2026-09-25 16:31:45", "Diya Nair", "U230102", "diya.n@example.com", "Ms", "3rd", "CSBS", "Beta", "9847000002", "5", "4", "Loved the hands-on crisis scenario."],
            ["2026-09-25 16:32:20", "Rohan Kurian", "U230103", "rohan.k@example.com", "Mr", "2nd", "IT", "Alpha", "9847000003", "4", "5", "Very interactive and informative."],
            ["2026-09-25 16:33:05", "Ananya Menon", "U230104", "ananya.m@example.com", "Ms", "4th", "AD", "Nil", "9847000004", "5", "5", "The panel discussion was incredible."],
            ["2026-09-25 16:34:12", "Kevin Varghese", "U230105", "kevin.v@example.com", "Mr", "3rd", "CSE", "Gamma", "9847000005", "4", "4", "Well-coordinated event."],
            ["2026-09-25 16:35:40", "Sneha Roy", "U230106", "sneha.r@example.com", "Ms", "2nd", "CSBS", "Alpha", "9847000006", "5", "5", "Clear explanations and great speakers."],
            ["2026-09-25 16:36:15", "Adithya P", "U230107", "adithya.p@example.com", "Mr", "3rd", "IT", "Beta", "9847000007", "4", "4", "Keep organizing more of these."],
            ["2026-09-25 16:37:02", "Meera Pillai", "U230108", "meera.p@example.com", "Ms", "1st", "CSE", "Delta", "9847000008", "5", "5", "Inspiring tech talk!"],
          ],
        });
      }

      // Default: Registration attendee rows
      return NextResponse.json({
        success: true,
        headers: [
          "Timestamp",
          "Title",
          "Full Name",
          "College Email ID",
          "WhatsApp Number",
          "Current Year of Study",
          "Department / Branch",
          "Class Section / Division",
          "Are you an active CSI Member?",
          "CSI Membership Number (if applicable)",
        ],
        rows: [
          ["2026-09-20 10:12:00", "Mr", "Aarav Sharma", "aarav.s@example.com", "9847000001", "3rd year", "CSE", "Alpha", "Yes", "CSI-MEM-101"],
          ["2026-09-20 10:15:30", "Ms", "Diya Nair", "diya.n@example.com", "9847000002", "3rd year", "CSBS", "Beta", "No", ""],
          ["2026-09-20 10:18:45", "Mr", "Rohan Kurian", "rohan.k@example.com", "9847000003", "2nd year", "IT", "Alpha", "Yes", "CSI-MEM-102"],
          ["2026-09-20 10:20:10", "Ms", "Ananya Menon", "ananya.m@example.com", "9847000004", "4th year", "AD", "Nil", "Yes", "CSI-MEM-103"],
          ["2026-09-20 10:22:15", "Mr", "Kevin Varghese", "kevin.v@example.com", "9847000005", "3rd year", "CSE", "Gamma", "No", ""],
          ["2026-09-20 10:25:00", "Ms", "Sneha Roy", "sneha.r@example.com", "9847000006", "2nd year", "CSBS", "Alpha", "No", ""],
          ["2026-09-20 10:28:30", "Mr", "Adithya P", "adithya.p@example.com", "9847000007", "3rd year", "IT", "Beta", "Yes", "CSI-MEM-104"],
          ["2026-09-20 10:31:00", "Ms", "Meera Pillai", "meera.p@example.com", "9847000008", "1st year", "CSE", "Delta", "No", ""],
          ["2026-09-20 10:33:45", "Mr", "Naveen Joy", "naveen.j@example.com", "9847000009", "3rd year", "AD", "Alpha", "Yes", "CSI-MEM-105"],
          ["2026-09-20 10:36:20", "Ms", "Sarah Elsa", "sarah.e@example.com", "9847000010", "2nd year", "CSE", "Beta", "No", ""],
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: `Action '${action}' executed successfully (Simulated Sandbox).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process sandbox request.",
      },
      { status: 500 }
    );
  }
}

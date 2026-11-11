import { Member, CSIEvent, RegisteredAttendee, FeedbackAttendee } from "./types";

// ============================================================================
// CSI Operations - Showcase Sample Data (Sandbox Mode)
// ============================================================================
// Pre-loaded realistic sample coordinators and 3 comprehensive event containers
// to demonstrate the platform's full lifecycle workflows:
//   1. Planned Event (Ready for forms and approval letters)
//   2. Ongoing Event (Pre-populated with 25 registered attendees & attendance roster)
//   3. Completed Event (Pre-populated with 20 feedback responses, merit winners & certificates)
// ============================================================================

export const members: Member[] = [
  { id: "m1", name: "Alex Johnson", role: "President", domain: "Executive", class_batch: "S7 CS A", member_type: "old_coordinator", is_active: true, events_coordinated_count: 2 },
  { id: "m2", name: "Priya Sharma", role: "Vice President", domain: "Executive", class_batch: "S7 CS B", member_type: "old_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m3", name: "David Miller", role: "Secretary", domain: "Executive", class_batch: "S7 IT", member_type: "old_coordinator", is_active: true, events_coordinated_count: 2 },
  { id: "m4", name: "Amina Khan", role: "Joint Secretary", domain: "Executive", class_batch: "S7 CSBS", member_type: "old_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m5", name: "Siddharth Verma", role: "Operations Lead", domain: "Operations", class_batch: "S5 CS C", member_type: "old_coordinator", is_active: true, events_coordinated_count: 2 },
  { id: "m6", name: "Sneha Roy", role: "Operations Co-Lead", domain: "Operations", class_batch: "S3 CS A", member_type: "new_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m7", name: "Kevin Varghese", role: "Technical Lead", domain: "Technical", class_batch: "S5 IT", member_type: "old_coordinator", is_active: true, events_coordinated_count: 3 },
  { id: "m8", name: "Neha Patel", role: "Technical Co-Lead", domain: "Technical", class_batch: "S3 AD", member_type: "new_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m9", name: "Rohan Kurian", role: "Creative Lead", domain: "Creative", class_batch: "S5 CSBS", member_type: "old_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m10", name: "Diya Nair", role: "Creative Co-Lead", domain: "Creative", class_batch: "S3 CS B", member_type: "new_coordinator", is_active: true, events_coordinated_count: 2 },
  { id: "m11", name: "Adithya P", role: "Documentation Lead", domain: "Documentation", class_batch: "S7 CS A", member_type: "old_coordinator", is_active: true, events_coordinated_count: 2 },
  { id: "m12", name: "Ananya Menon", role: "Documentation Co-Lead", domain: "Documentation", class_batch: "S3 IT", member_type: "new_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m13", name: "Kripa Ann", role: "Marketing Lead", domain: "Marketing", class_batch: "S5 AD", member_type: "old_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m14", name: "Ben George", role: "Marketing Co-Lead", domain: "Marketing", class_batch: "S3 CS C", member_type: "new_coordinator", is_active: true, events_coordinated_count: 1 },
  { id: "m15", name: "Sarah Elsa", role: "Sub-Core (Technical)", domain: "Technical", class_batch: "S3 CS D", member_type: "new_coordinator", is_active: true, events_coordinated_count: 0 },
  { id: "m16", name: "Naveen Joy", role: "Sub-Core (Operations)", domain: "Operations", class_batch: "S3 AD", member_type: "new_coordinator", is_active: true, events_coordinated_count: 0 },
];

// Sample 25 registered attendees for Event 2 (Ongoing)
const sample25Attendees: RegisteredAttendee[] = [
  { sl_no: 1, name: "Aarav Sharma", roll_no: "U230101", class_batch: "S5 CS A", gender: "Male" },
  { sl_no: 2, name: "Diya Nair", roll_no: "U230102", class_batch: "S5 CSBS", gender: "Female" },
  { sl_no: 3, name: "Rohan Kurian", roll_no: "U230103", class_batch: "S3 IT", gender: "Male" },
  { sl_no: 4, name: "Ananya Menon", roll_no: "U230104", class_batch: "S7 AD", gender: "Female" },
  { sl_no: 5, name: "Kevin Varghese", roll_no: "U230105", class_batch: "S5 CS C", gender: "Male" },
  { sl_no: 6, name: "Sneha Roy", roll_no: "U230106", class_batch: "S3 CSBS", gender: "Female" },
  { sl_no: 7, name: "Adithya P", roll_no: "U230107", class_batch: "S5 IT", gender: "Male" },
  { sl_no: 8, name: "Meera Pillai", roll_no: "U230108", class_batch: "S1 CS D", gender: "Female" },
  { sl_no: 9, name: "Naveen Joy", roll_no: "U230109", class_batch: "S5 AD", gender: "Male" },
  { sl_no: 10, name: "Sarah Elsa", roll_no: "U230110", class_batch: "S3 CS B", gender: "Female" },
  { sl_no: 11, name: "Gautham Krishna", roll_no: "U230111", class_batch: "S5 ECE", gender: "Male" },
  { sl_no: 12, name: "Tessa Mary", roll_no: "U230112", class_batch: "S3 AD", gender: "Female" },
  { sl_no: 13, name: "Abhay Joseph", roll_no: "U230113", class_batch: "S5 CS A", gender: "Male" },
  { sl_no: 14, name: "Rithika Sen", roll_no: "U230114", class_batch: "S3 IT", gender: "Female" },
  { sl_no: 15, name: "Joel Mathew", roll_no: "U230115", class_batch: "S7 CSBS", gender: "Male" },
  { sl_no: 16, name: "Lakshmi Priya", roll_no: "U230116", class_batch: "S3 CS C", gender: "Female" },
  { sl_no: 17, name: "Arjun Rajesh", roll_no: "U230117", class_batch: "S5 AD", gender: "Male" },
  { sl_no: 18, name: "Maria Thomas", roll_no: "U230118", class_batch: "S5 CS B", gender: "Female" },
  { sl_no: 19, name: "Sanjay Kumar", roll_no: "U230119", class_batch: "S7 IT", gender: "Male" },
  { sl_no: 20, name: "Bhavana Suresh", roll_no: "U230120", class_batch: "S3 CS A", gender: "Female" },
  { sl_no: 21, name: "Deepak Nambiar", roll_no: "U230121", class_batch: "S5 ECE", gender: "Male" },
  { sl_no: 22, name: "Kavya Ramesh", roll_no: "U230122", class_batch: "S3 CSBS", gender: "Female" },
  { sl_no: 23, name: "Vishal George", roll_no: "U230123", class_batch: "S7 CS A", gender: "Male" },
  { sl_no: 24, name: "Swathi Mohan", roll_no: "U230124", class_batch: "S5 AD", gender: "Female" },
  { sl_no: 25, name: "Farhan Ali", roll_no: "U230125", class_batch: "S3 IT", gender: "Male" },
];

// Sample 20 feedback attendees for Event 3 (Completed with Winners)
const sample20FeedbackAttendees: FeedbackAttendee[] = [
  { uid: "U230101", name: "Aarav Sharma", email: "aarav.s@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "CSE", section: "Alpha", whatsapp: "9847000001", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Exceptional pitch session and great leadership feedback." },
  { uid: "U230102", name: "Diya Nair", email: "diya.n@rajagiri.edu", gender: "Ms", year_of_study: "3rd", branch: "CSBS", section: "Beta", whatsapp: "9847000002", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "4" }, comments: "The crisis management simulation was very engaging." },
  { uid: "U230103", name: "Rohan Kurian", email: "rohan.k@rajagiri.edu", gender: "Mr", year_of_study: "2nd", branch: "IT", section: "Alpha", whatsapp: "9847000003", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "5" }, comments: "Great panel questions and judges' insights." },
  { uid: "U230104", name: "Ananya Menon", email: "ananya.m@rajagiri.edu", gender: "Ms", year_of_study: "4th", branch: "AD", section: "Nil", whatsapp: "9847000004", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Well-structured rounds." },
  { uid: "U230105", name: "Kevin Varghese", email: "kevin.v@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "CSE", section: "Gamma", whatsapp: "9847000005", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "4" }, comments: "Smooth audio-visual and time management." },
  { uid: "U230106", name: "Sneha Roy", email: "sneha.r@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "CSBS", section: "Alpha", whatsapp: "9847000006", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Loved the mock tech leadership round!" },
  { uid: "U230107", name: "Adithya P", email: "adithya.p@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "IT", section: "Beta", whatsapp: "9847000007", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "4" }, comments: "Good organization." },
  { uid: "U230108", name: "Meera Pillai", email: "meera.p@rajagiri.edu", gender: "Ms", year_of_study: "1st", branch: "CSE", section: "Delta", whatsapp: "9847000008", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Exciting technical debate." },
  { uid: "U230109", name: "Naveen Joy", email: "naveen.j@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "AD", section: "Alpha", whatsapp: "9847000009", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "5" }, comments: "Helpful pointers on public speaking." },
  { uid: "U230110", name: "Sarah Elsa", email: "sarah.e@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "CSE", section: "Beta", whatsapp: "9847000010", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "4" }, comments: "Keep organizing more of these debate initiatives." },
  { uid: "U230111", name: "Gautham Krishna", email: "gautham.k@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "ECE", section: "Alpha", whatsapp: "9847000011", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "4" }, comments: "Good experience overall." },
  { uid: "U230112", name: "Tessa Mary", email: "tessa.m@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "AD", section: "Gamma", whatsapp: "9847000012", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Very fun and competitive." },
  { uid: "U230113", name: "Abhay Joseph", email: "abhay.j@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "CSE", section: "Alpha", whatsapp: "9847000013", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "4" }, comments: "Engaging scenarios." },
  { uid: "U230114", name: "Rithika Sen", email: "rithika.s@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "IT", section: "Delta", whatsapp: "9847000014", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "5" }, comments: "Well-managed timeline." },
  { uid: "U230115", name: "Joel Mathew", email: "joel.m@rajagiri.edu", gender: "Mr", year_of_study: "4th", branch: "CSBS", section: "Beta", whatsapp: "9847000015", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Great mock leadership round." },
  { uid: "U230116", name: "Lakshmi Priya", email: "lakshmi.p@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "CSE", section: "Gamma", whatsapp: "9847000016", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "4" }, comments: "Appreciated the direct feedback from seniors." },
  { uid: "U230117", name: "Arjun Rajesh", email: "arjun.r@rajagiri.edu", gender: "Mr", year_of_study: "3rd", branch: "AD", section: "Alpha", whatsapp: "9847000017", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Awesome event format." },
  { uid: "U230118", name: "Maria Thomas", email: "maria.t@rajagiri.edu", gender: "Ms", year_of_study: "3rd", branch: "CSE", section: "Beta", whatsapp: "9847000018", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "4" }, comments: "Loved the crisis pitch scenario." },
  { uid: "U230119", name: "Sanjay Kumar", email: "sanjay.k@rajagiri.edu", gender: "Mr", year_of_study: "4th", branch: "IT", section: "Nil", whatsapp: "9847000019", ratings: { "Overall Event Quality (PO10)": "4", "Relevance & Execution (PO11)": "4" }, comments: "Smooth organization." },
  { uid: "U230120", name: "Bhavana Suresh", email: "bhavana.s@rajagiri.edu", gender: "Ms", year_of_study: "2nd", branch: "CSE", section: "Alpha", whatsapp: "9847000020", ratings: { "Overall Event Quality (PO10)": "5", "Relevance & Execution (PO11)": "5" }, comments: "Learned a lot about executive decision making." },
];

export const events: CSIEvent[] = [
  // -------------------------------------------------------------
  // CONTAINER 1: Planned / Upcoming Event
  // Showcase: Coordinator allocation, approval letter generation,
  // and 1-click Google Drive Form generation.
  // -------------------------------------------------------------
  {
    id: "e1",
    event_name: "CodeStorm 2026 – 24hr State Hackathon",
    event_date: "2026-11-28",
    time_start: "09:30 AM",
    time_end: "04:30 PM",
    mode: "Offline",
    venue: "Main Auditorium & Computing Labs",
    status: "planned",
    target_branches: ["CSE", "CSBS", "IT", "AD"],
    faculty_in_charge: "Dr. Tripti C (Faculty Coordinator)",
    brief_description: "Flagship 24-hour state-level hackathon challenging students to solve real-world industry problems across AI, Web3, and Systems Engineering.",
    required_coordinators: 3,
    assigned_coordinators: ["Alex Johnson", "Priya Sharma", "David Miller"],
  },

  // -------------------------------------------------------------
  // CONTAINER 2: Ongoing / Confirmed Event with 25 Attendees
  // Showcase: Live registration links, Attendance Sheet generation
  // (.docx and .pdf with RSET/CSI crests), and RSMS Notice.
  // -------------------------------------------------------------
  {
    id: "e2",
    event_name: "AI & Neural Agents Hands-On Bootcamp",
    event_date: "2026-10-15",
    time_start: "10:00 AM",
    time_end: "01:00 PM",
    mode: "Offline",
    venue: "Multimedia Lab 1",
    status: "confirmed",
    target_branches: ["CSE", "CSBS", "IT", "AD", "ECE"],
    faculty_in_charge: "Dr. Tripti C (Faculty Coordinator)",
    brief_description: "Intensive hands-on technical workshop on building autonomous LLM agents and multi-agent collaborative workflows.",
    required_coordinators: 2,
    assigned_coordinators: ["Amina Khan", "Siddharth Verma"],
    google_form_url: "https://forms.google.com/demo-ai-bootcamp-reg",
    google_form_edit_url: "https://docs.google.com/forms/d/demo-ai-bootcamp-edit/edit",
    google_form_id: "demo-ai-bootcamp-form-id",
    google_sheet_url: "https://docs.google.com/spreadsheets/d/demo-ai-bootcamp-sheet/edit",
    google_sheet_id: "demo-ai-bootcamp-sheet-id",
    is_registration_closed: false,
    registered_attendees: sample25Attendees,
  },

  // -------------------------------------------------------------
  // CONTAINER 3: Completed Flagship Event with Feedback & Winners
  // Showcase: Outcome-Based feedback (PO10/PO11), Certificate Studio,
  // visual PDF customizer, ordinal superscripts (1ˢᵗ, 2ⁿᵈ, 3ʳᵈ), and ZIP export.
  // -------------------------------------------------------------
  {
    id: "e3",
    event_name: "Off the Script – Leadership & Tech Debate",
    event_date: "2026-09-25",
    time_start: "01:30 PM",
    time_end: "04:30 PM",
    mode: "Offline",
    venue: "Main Auditorium",
    status: "completed",
    target_branches: ["CSE", "CSBS", "IT", "AD"],
    faculty_in_charge: "Dr. Tripti C (Faculty Coordinator)",
    brief_description: "Impromptu tech pitch, crisis management scenario, and mock tech leadership panel.",
    required_coordinators: 4,
    assigned_coordinators: ["Alex Johnson", "Kevin Varghese", "Neha Patel", "Rohan Kurian"],
    google_form_url: "https://forms.google.com/demo-off-the-script-reg",
    google_form_edit_url: "https://docs.google.com/forms/d/demo-off-the-script-reg-edit/edit",
    google_form_id: "demo-off-the-script-form-id",
    google_sheet_url: "https://docs.google.com/spreadsheets/d/demo-off-the-script-reg-sheet/edit",
    google_sheet_id: "demo-off-the-script-sheet-id",
    is_registration_closed: true,
    feedback_google_form_url: "https://forms.google.com/demo-off-the-script-feedback",
    feedback_google_form_edit_url: "https://docs.google.com/forms/d/demo-off-the-script-feedback-edit/edit",
    feedback_google_form_id: "demo-off-the-script-feedback-id",
    feedback_google_sheet_url: "https://docs.google.com/spreadsheets/d/demo-off-the-script-feedback-sheet/edit",
    feedback_google_sheet_id: "demo-off-the-script-feedback-sheet-id",
    is_feedback_closed: true,
    feedback_attendees: sample20FeedbackAttendees,
    winners: {
      first_place: "Aarav Sharma",
      second_place: "Diya Nair",
      third_place: "Rohan Kurian",
    },
  },
];

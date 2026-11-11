"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  Copy,
  QrCode,
  Download,
  Lock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileDown,
  Printer,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Loader2,
  RefreshCw,
  FolderPlus,
  Check,
  Trophy,
  Award,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  HelpCircle,
  ChevronDown,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import {
  CSIEvent,
  RegisteredAttendee,
  FeedbackAttendee,
  FeedbackQuestion,
} from "@/lib/types";
import { members } from "@/lib/data";
import { getStoredEvents, getEventById, deleteEvent, updateEvent, syncEventsWithSupabase } from "@/lib/eventsStorage";
import { supabase } from "@/lib/supabaseClient";
import {
  generateEventGoogleAppsScript,
  getDepartmentChoices,
  mapGoogleFormResponsesToAttendance,
} from "@/lib/formScriptGenerator";
import {
  generateDefaultFeedbackQuestions,
  generateFeedbackGoogleAppsScript,
  getFeedbackHeaderDescription,
  mapGoogleSheetToFeedbackAttendees,
  generateMockFeedbackResponses,
  PO_DEFINITIONS,
} from "@/lib/feedbackFormGenerator";
import {
  exportSingleCertificatePdf,
  exportBatchCertificatesPdf,
} from "@/lib/certificateExport";
import {
  exportRsmsPdf,
  exportRsmsWord,
  exportPermissionPdf,
  exportPermissionWord,
  exportAttendancePdf,
  exportAttendanceWord,
  formatFullDateWithDay,
  formatShortSlashDate,
} from "@/lib/documentExport";
import SimulatedFormModal from "@/components/SimulatedFormModal";

export default function EventContainerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<CSIEvent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleDeleteEvent = () => {
    if (!event) return;
    if (window.confirm(`Are you sure you want to delete event "${event.event_name}"? This action cannot be undone.`)) {
      deleteEvent(event.id);
      router.push("/events");
    }
  };

  // Google Apps Script Modal State
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Google Drive Automated Integration State
  const [isCreatingFormInDrive, setIsCreatingFormInDrive] = useState(false);
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);
  const [isSyncingFromDrive, setIsSyncingFromDrive] = useState(false);
  const [driveActionNotice, setDriveActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-App Simulated Form Modals State (100% Local Device Sandbox)
  const [isSimulatedFormOpen, setIsSimulatedFormOpen] = useState(false);
  const [isSimulatedFeedbackOpen, setIsSimulatedFeedbackOpen] = useState(false);

  // Google Sheet / Registrations Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [sheetInput, setSheetInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const eventScriptCode = event ? generateEventGoogleAppsScript(event) : "";
  const eventDepartments = event ? getDepartmentChoices(event.target_branches) : [];

  const handleCopyScript = () => {
    navigator.clipboard.writeText(eventScriptCode);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2500);
  };

  const handleCreateFormInDrive = async () => {
    if (!event) return;
    setIsCreatingFormInDrive(true);
    setDriveActionNotice(null);

    try {
      const res = await fetch("/api/google-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_form",
          eventName: event.event_name,
          targetDepartments: eventDepartments,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create form in Google Drive.");
      }

      const updated: CSIEvent = {
        ...event,
        google_form_url: data.formUrl,
        google_form_edit_url: data.editUrl,
        google_form_id: data.formId,
        google_sheet_url: data.sheetUrl,
        google_sheet_id: data.sheetId,
        registration_url: data.formUrl,
        is_registration_closed: false,
      };

      setEvent(updated);
      updateEvent(updated);
      setDriveActionNotice({
        type: "success",
        text: "Google Form & Responses Sheet created directly in your CSI Google Drive!",
      });
    } catch (err: any) {
      setDriveActionNotice({
        type: "error",
        text: err.message || "Failed to connect to Google Drive Webhook.",
      });
    } finally {
      setIsCreatingFormInDrive(false);
    }
  };

  const handleSimulatedRegistered = (newAtt: RegisteredAttendee) => {
    if (!event) return;
    const currentList = event.registered_attendees || [];
    const updatedList = [...currentList, newAtt];
    const updated: CSIEvent = {
      ...event,
      registered_attendees: updatedList,
    };
    setEvent(updated);
    updateEvent(updated);
    setDriveActionNotice({
      type: "success",
      text: `Test student "${newAtt.name}" successfully registered and added to the Attendance Sheet!`,
    });
  };

  const handleSimulatedFeedback = (newFb: FeedbackAttendee) => {
    if (!event) return;
    const currentList = event.feedback_attendees || [];
    const updatedList = [...currentList, newFb];
    const updated: CSIEvent = {
      ...event,
      feedback_attendees: updatedList,
    };
    setEvent(updated);
    updateEvent(updated);
    setFeedbackActionNotice({
      type: "success",
      text: `Verified participant "${newFb.name}" submitted feedback and added to Certificate Studio pipeline!`,
    });
  };

  const handleToggleRegistrationStatus = async () => {
    if (!event) return;
    const willClose = !event.is_registration_closed;
    setIsTogglingRegistration(true);
    setDriveActionNotice(null);

    try {
      if (willClose && event.google_form_id) {
        await fetch("/api/google-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "close_form",
            formId: event.google_form_id,
          }),
        });
      }

      const updated: CSIEvent = {
        ...event,
        is_registration_closed: willClose,
      };
      setEvent(updated);
      updateEvent(updated);
      setDriveActionNotice({
        type: "success",
        text: willClose
          ? "Registration closed! You can now sync the final roster into the Attendance Sheet."
          : "Registration is re-opened.",
      });
    } catch (err: any) {
      setDriveActionNotice({
        type: "error",
        text: err.message || "Failed to update registration status.",
      });
    } finally {
      setIsTogglingRegistration(false);
    }
  };

  const handleSyncFinalRosterFromDrive = async () => {
    const currentEv = getEventById(eventId) || event;
    if (!currentEv) return;
    setIsSyncingFromDrive(true);
    setDriveActionNotice(null);

    try {
      let sheetId = currentEv.google_sheet_id || event?.google_sheet_id;
      const sheetUrl = currentEv.google_sheet_url || event?.google_sheet_url;
      if (!sheetId && sheetUrl) {
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) sheetId = match[1];
      }

      if (!sheetId) {
        sheetId = "demo-reg-sheet-id";
      }

      const res = await fetch("/api/google-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_responses",
          sheetId: sheetId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Could not fetch responses from Google Sheet.");
      }

      const attendees = mapGoogleFormResponsesToAttendance(data.headers || [], data.rows || []);
      if (attendees.length === 0) {
        throw new Error("No responses found in the Google Sheet yet.");
      }

      const updated: CSIEvent = {
        ...currentEv,
        ...(event || {}),
        registered_attendees: attendees,
      };

      setEvent(updated);
      updateEvent(updated);
      setDriveActionNotice({
        type: "success",
        text: `Successfully mapped ${attendees.length} registered students to the Attendance Sheet!`,
      });
    } catch (err: any) {
      setDriveActionNotice({
        type: "error",
        text: err.message || "Failed to fetch registrations from Google Sheet.",
      });
    } finally {
      setIsSyncingFromDrive(false);
    }
  };

  const sampleAttendees: RegisteredAttendee[] = [
    { sl_no: 1, name: "LEYAH MARY THOMAS", gender: "Female", class_batch: "S7 CS A" },
    { sl_no: 2, name: "Safa Nazar", gender: "Female", class_batch: "S7 CSBS" },
    { sl_no: 3, name: "Neha R Jacob", gender: "Female", class_batch: "S5 CS C" },
    { sl_no: 4, name: "Naveena Joy", gender: "Female", class_batch: "S5 IT" },
    { sl_no: 5, name: "Nikitha Rajeev", gender: "Female", class_batch: "S5 AD" },
    { sl_no: 6, name: "Sarah Elsa Laji", gender: "Female", class_batch: "S3 CS D" },
    { sl_no: 7, name: "Tessa j kudakassery", gender: "Female", class_batch: "S3 AD" },
  ];

  const handleApplySampleAttendees = () => {
    if (!event) return;
    const updated = {
      ...event,
      registered_attendees: sampleAttendees,
    };
    setEvent(updated);
    updateEvent(updated);
    setSyncStatus({ success: true, message: `Loaded ${sampleAttendees.length} sample attendees from reference scan!` });
    setTimeout(() => {
      setIsSyncModalOpen(false);
      setSyncStatus(null);
    }, 1200);
  };

  const handleSyncData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !sheetInput.trim()) return;
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      let rawText = sheetInput.trim();

      // If user pasted a Google Sheet URL, convert to CSV export URL and fetch
      if (rawText.startsWith("http://") || rawText.startsWith("https://")) {
        const match = rawText.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
          try {
            const res = await fetch(csvExportUrl);
            if (!res.ok) throw new Error("Could not fetch Google Sheet CSV. Ensure Sheet Sharing is set to 'Anyone with the link can view'.");
            rawText = await res.text();
          } catch (fetchErr: any) {
            throw new Error(fetchErr.message || "Could not access Google Sheet online. Alternatively, copy and paste the sheet rows directly here.");
          }
        }
      }

      // Parse lines
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("Pasted data must include a header row and at least one student row.");
      }

      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter);
      const rows = lines.slice(1).map((l) => l.split(delimiter));

      const attendees = mapGoogleFormResponsesToAttendance(headers, rows);

      if (attendees.length === 0) {
        throw new Error("No student names could be extracted.");
      }

      const updated = {
        ...event,
        google_sheet_url: sheetInput.startsWith("http") ? sheetInput : event.google_sheet_url,
        registered_attendees: attendees,
      };
      setEvent(updated);
      updateEvent(updated);
      setSyncStatus({ success: true, message: `Successfully mapped ${attendees.length} registered students to the Attendance Sheet!` });
      setTimeout(() => {
        setIsSyncModalOpen(false);
        setSyncStatus(null);
        setSheetInput("");
      }, 1500);
    } catch (err: any) {
      setSyncStatus({ success: false, message: err.message || "Failed to parse registration sheet." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAttendees = () => {
    if (!event) return;
    if (window.confirm("Clear mapped attendees from this attendance sheet?")) {
      const updated = {
        ...event,
        registered_attendees: undefined,
      };
      setEvent(updated);
      updateEvent(updated);
    }
  };

  // -------------------------------------------------------------
  // FEEDBACK FORM & CERTIFICATE PIPELINE STATES
  // -------------------------------------------------------------
  const [activeFeedbackQuestions, setActiveFeedbackQuestions] = useState<FeedbackQuestion[]>([]);
  const [isCreatingFeedbackInDrive, setIsCreatingFeedbackInDrive] = useState(false);
  const [isTogglingFeedback, setIsTogglingFeedback] = useState(false);
  const [isSyncingFeedbackFromDrive, setIsSyncingFeedbackFromDrive] = useState(false);
  const [feedbackActionNotice, setFeedbackActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preview Toggles
  const [showRegPreview, setShowRegPreview] = useState(false);
  const [showFeedbackPreview, setShowFeedbackPreview] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Modals for Feedback
  const [isFeedbackScriptModalOpen, setIsFeedbackScriptModalOpen] = useState(false);
  const [feedbackScriptCopied, setFeedbackScriptCopied] = useState(false);
  const [isFeedbackSyncModalOpen, setIsFeedbackSyncModalOpen] = useState(false);
  const [feedbackSheetInput, setFeedbackSheetInput] = useState("");
  const [isFeedbackSyncing, setIsFeedbackSyncing] = useState(false);
  const [feedbackSyncStatus, setFeedbackSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Certificate Pipeline States
  const [firstPlaceWinner, setFirstPlaceWinner] = useState<string>("");
  const [secondPlaceWinner, setSecondPlaceWinner] = useState<string>("");
  const [thirdPlaceWinner, setThirdPlaceWinner] = useState<string>("");
  const [previewCertAttendee, setPreviewCertAttendee] = useState<FeedbackAttendee | null>(null);
  const [previewCertPosition, setPreviewCertPosition] = useState<"1st" | "2nd" | "3rd" | "participant">("participant");

  const feedbackScriptCode = event ? generateFeedbackGoogleAppsScript(event, activeFeedbackQuestions) : "";

  // Initialize feedback questions and saved winners when event loads
  useEffect(() => {
    if (event) {
      setActiveFeedbackQuestions(generateDefaultFeedbackQuestions(event));
      if (event.winners) {
        const toFirstStr = (val?: string | string[]) =>
          Array.isArray(val) ? (val[0] || "") : (val || "");
        setFirstPlaceWinner(toFirstStr(event.winners.first_place));
        setSecondPlaceWinner(toFirstStr(event.winners.second_place));
        setThirdPlaceWinner(toFirstStr(event.winners.third_place));
      }

      const targetUrl = event.feedback_google_form_url || `https://forms.gle/csi-feedback-${event.id}`;
      QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [event?.id, event?.feedback_google_form_url, event?.event_name, event?.brief_description]);

  const handleCopyFeedbackScript = () => {
    navigator.clipboard.writeText(feedbackScriptCode);
    setFeedbackScriptCopied(true);
    setTimeout(() => setFeedbackScriptCopied(false), 2500);
  };

  const handleCreateFeedbackInDrive = async () => {
    if (!event) return;
    setIsCreatingFeedbackInDrive(true);
    setFeedbackActionNotice(null);

    try {
      const res = await fetch("/api/google-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_feedback_form",
          eventName: event.event_name,
          description: getFeedbackHeaderDescription(event),
          targetDepartments: eventDepartments,
          questions: activeFeedbackQuestions,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create feedback form in Google Drive.");
      }

      const updated: CSIEvent = {
        ...event,
        feedback_google_form_url: data.formUrl,
        feedback_google_form_edit_url: data.editUrl,
        feedback_google_form_id: data.formId,
        feedback_google_sheet_url: data.sheetUrl,
        feedback_google_sheet_id: data.sheetId,
        feedback_url: data.formUrl,
        is_feedback_closed: false,
      };

      setEvent(updated);
      updateEvent(updated);
      setFeedbackActionNotice({
        type: "success",
        text: "Feedback Form & Responses Sheet created directly in your CSI Google Drive!",
      });
    } catch (err: any) {
      setFeedbackActionNotice({
        type: "error",
        text: err.message || "Failed to connect to Google Drive Webhook.",
      });
    } finally {
      setIsCreatingFeedbackInDrive(false);
    }
  };

  const handleToggleFeedbackStatus = async () => {
    if (!event) return;
    const willClose = !event.is_feedback_closed;
    setIsTogglingFeedback(true);
    setFeedbackActionNotice(null);

    try {
      if (event.feedback_google_form_id) {
        await fetch("/api/google-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "close_form",
            formId: event.feedback_google_form_id,
            acceptResponses: !willClose,
          }),
        });
      }

      const updated: CSIEvent = {
        ...event,
        is_feedback_closed: willClose,
      };
      setEvent(updated);
      updateEvent(updated);
      setFeedbackActionNotice({
        type: "success",
        text: willClose
          ? "Feedback Form closed! You can now generate verified certificates from the responses."
          : "Feedback Form re-opened for responses.",
      });
    } catch (err: any) {
      setFeedbackActionNotice({
        type: "error",
        text: err.message || "Failed to update feedback form status.",
      });
    } finally {
      setIsTogglingFeedback(false);
    }
  };

  const handleSyncFeedbackFromDrive = async () => {
    const currentEv = getEventById(eventId) || event;
    if (!currentEv) return;
    setIsSyncingFeedbackFromDrive(true);
    setFeedbackActionNotice(null);

    try {
      let sheetId = currentEv.feedback_google_sheet_id || event?.feedback_google_sheet_id;
      const sheetUrl = currentEv.feedback_google_sheet_url || event?.feedback_google_sheet_url;
      if (!sheetId && sheetUrl) {
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) sheetId = match[1];
      }

      if (!sheetId) {
        sheetId = "demo-feedback-sheet-id";
      }

      const res = await fetch("/api/google-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_responses",
          sheetId: sheetId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Could not fetch responses from Feedback Google Sheet.");
      }

      const attendees = mapGoogleSheetToFeedbackAttendees(data.headers || [], data.rows || []);
      if (attendees.length === 0) {
        throw new Error("No responses found in the Feedback Google Sheet yet. Attendees must submit feedback first.");
      }

      const updated: CSIEvent = {
        ...currentEv,
        ...(event || {}),
        feedback_attendees: attendees,
      };

      setEvent(updated);
      updateEvent(updated);
      setFeedbackActionNotice({
        type: "success",
        text: `Successfully synced ${attendees.length} verified participant(s) into the Certificate Generation Pipeline!`,
      });
    } catch (err: any) {
      setFeedbackActionNotice({
        type: "error",
        text: err.message || "Failed to fetch feedback responses from Google Sheet.",
      });
    } finally {
      setIsSyncingFeedbackFromDrive(false);
    }
  };

  const handleApplySampleFeedback = () => {
    if (!event) return;
    const sampleAttendees = generateMockFeedbackResponses(event);
    const updated: CSIEvent = {
      ...event,
      feedback_attendees: sampleAttendees,
    };
    setEvent(updated);
    updateEvent(updated);
    setFeedbackSyncStatus({
      success: true,
      message: `Loaded ${sampleAttendees.length} sample feedback submissions!`,
    });
    setTimeout(() => {
      setIsFeedbackSyncModalOpen(false);
      setFeedbackSyncStatus(null);
    }, 1200);
  };

  const handleSyncFeedbackData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !feedbackSheetInput.trim()) return;
    setIsFeedbackSyncing(true);
    setFeedbackSyncStatus(null);

    try {
      let rawText = feedbackSheetInput.trim();

      if (rawText.startsWith("http://") || rawText.startsWith("https://")) {
        const match = rawText.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
          try {
            const res = await fetch(csvExportUrl);
            if (!res.ok) throw new Error("Could not fetch Google Sheet CSV. Ensure Sheet Sharing is set to 'Anyone with the link can view'.");
            rawText = await res.text();
          } catch (fetchErr: any) {
            throw new Error(fetchErr.message || "Could not access Google Sheet online. Alternatively, copy and paste the sheet rows directly.");
          }
        }
      }

      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("Pasted data must include a header row and at least one student response row.");
      }

      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter);
      const rows = lines.slice(1).map((l) => l.split(delimiter));

      const attendees = mapGoogleSheetToFeedbackAttendees(headers, rows);
      if (attendees.length === 0) {
        throw new Error("No student feedback could be extracted.");
      }

      const updated: CSIEvent = {
        ...event,
        feedback_google_sheet_url: feedbackSheetInput.startsWith("http") ? feedbackSheetInput : event.feedback_google_sheet_url,
        feedback_attendees: attendees,
      };

      setEvent(updated);
      updateEvent(updated);
      setFeedbackSyncStatus({
        success: true,
        message: `Successfully mapped ${attendees.length} verified participant(s) into the Certificate Pipeline!`,
      });
      setTimeout(() => {
        setIsFeedbackSyncModalOpen(false);
        setFeedbackSyncStatus(null);
        setFeedbackSheetInput("");
      }, 1500);
    } catch (err: any) {
      setFeedbackSyncStatus({
        success: false,
        message: err.message || "Failed to parse feedback sheet.",
      });
    } finally {
      setIsFeedbackSyncing(false);
    }
  };

  const handleSaveWinners = () => {
    if (!event) return;
    const updated: CSIEvent = {
      ...event,
      winners: {
        first_place: firstPlaceWinner || undefined,
        second_place: secondPlaceWinner || undefined,
        third_place: thirdPlaceWinner || undefined,
      },
    };
    setEvent(updated);
    updateEvent(updated);
    alert("Merit winners saved! Certificates of Excellence can now be generated for 1st, 2nd, and 3rd place.");
  };

  const handleClearFeedbackAttendees = () => {
    if (!event) return;
    if (window.confirm("Clear all synced feedback attendees and reset certificate roster?")) {
      const updated: CSIEvent = {
        ...event,
        feedback_attendees: undefined,
        winners: undefined,
      };
      setFirstPlaceWinner("");
      setSecondPlaceWinner("");
      setThirdPlaceWinner("");
      setEvent(updated);
      updateEvent(updated);
    }
  };

  const handleDownloadSingleCertificate = (att: FeedbackAttendee) => {
    if (!event) return;
    let pos: "1st" | "2nd" | "3rd" | "participant" = "participant";
    if (firstPlaceWinner && (att.uid === firstPlaceWinner || att.name === firstPlaceWinner)) pos = "1st";
    else if (secondPlaceWinner && (att.uid === secondPlaceWinner || att.name === secondPlaceWinner)) pos = "2nd";
    else if (thirdPlaceWinner && (att.uid === thirdPlaceWinner || att.name === thirdPlaceWinner)) pos = "3rd";

    exportSingleCertificatePdf({
      attendee: att,
      eventName: event.event_name,
      eventDate: event.event_date,
      venue: event.venue,
      position: pos,
      facultyCoordinator: facultyCoordinator,
    });
  };

  const handleDownloadBatchCertificates = () => {
    if (!event || !event.feedback_attendees || event.feedback_attendees.length === 0) return;
    exportBatchCertificatesPdf(
      event.feedback_attendees,
      event.event_name,
      event.event_date,
      event.venue,
      {
        first_place: firstPlaceWinner,
        second_place: secondPlaceWinner,
        third_place: thirdPlaceWinner,
      },
      facultyCoordinator
    );
  };

  const handleDownloadMeritCertificates = () => {
    if (!event || !event.feedback_attendees) return;
    const meritAttendees = event.feedback_attendees.filter(
      (att) =>
        (firstPlaceWinner && (att.uid === firstPlaceWinner || att.name === firstPlaceWinner)) ||
        (secondPlaceWinner && (att.uid === secondPlaceWinner || att.name === secondPlaceWinner)) ||
        (thirdPlaceWinner && (att.uid === thirdPlaceWinner || att.name === thirdPlaceWinner))
    );

    if (meritAttendees.length === 0) {
      alert("Please select at least one winner (1st, 2nd, or 3rd Place) above first.");
      return;
    }

    exportBatchCertificatesPdf(
      meritAttendees,
      event.event_name,
      event.event_date,
      event.venue,
      {
        first_place: firstPlaceWinner,
        second_place: secondPlaceWinner,
        third_place: thirdPlaceWinner,
      },
      facultyCoordinator
    );
  };

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleUpdateStatus = async (newStatus: "planned" | "confirmed" | "completed") => {
    if (!event) return;
    setIsUpdatingStatus(true);
    try {
      const updated: CSIEvent = {
        ...event,
        status: newStatus,
      };
      setEvent(updated);
      await updateEvent(updated);
      setDriveActionNotice({
        type: "success",
        text:
          newStatus === "completed"
            ? `Event marked as Completed! Moved to Completed Archive.`
            : `Event reopened! Moved back to Active Containers.`,
      });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      const found = getEventById(eventId);
      if (found) {
        setEvent(found);
      }

      // Always fetch fresh live record from Supabase in background to ensure real-time URLs and status
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .maybeSingle();

          if (data && !error) {
            const currentLocal = getEventById(eventId);
            const formatted: CSIEvent = {
              id: data.id,
              event_name: data.event_name || currentLocal?.event_name || "Untitled Event",
              event_date: data.event_date || currentLocal?.event_date || new Date().toISOString().split("T")[0],
              time_start: data.time_start || currentLocal?.time_start || "09:30 AM",
              time_end: data.time_end || currentLocal?.time_end || "04:30 PM",
              mode: (data.mode || currentLocal?.mode || "Offline") as "Offline" | "Online",
              venue: data.venue || currentLocal?.venue || "Auditorium",
              target_branches: data.target_branches || currentLocal?.target_branches || ["CSE", "CSBS", "IT", "AD"],
              faculty_in_charge: data.faculty_in_charge || currentLocal?.faculty_in_charge || "Faculty Coordinator",
              brief_description: data.brief_description || currentLocal?.brief_description || "",
              status: (data.status || currentLocal?.status || "confirmed") as "planned" | "confirmed" | "completed",
              required_coordinators: Number(data.required_coordinators) || currentLocal?.required_coordinators || 2,
              assigned_coordinators: Array.isArray(data.assigned_coordinators) ? data.assigned_coordinators : (currentLocal?.assigned_coordinators || []),
              registration_url: data.registration_url || data.google_form_url || currentLocal?.registration_url || currentLocal?.google_form_url || undefined,
              google_form_url: data.google_form_url || currentLocal?.google_form_url || undefined,
              google_form_edit_url: data.google_form_edit_url || currentLocal?.google_form_edit_url || undefined,
              google_form_id: data.google_form_id || currentLocal?.google_form_id || undefined,
              google_sheet_url: data.google_sheet_url || currentLocal?.google_sheet_url || undefined,
              google_sheet_id: data.google_sheet_id || currentLocal?.google_sheet_id || undefined,
              is_registration_closed: data.is_registration_closed ?? currentLocal?.is_registration_closed ?? false,
              registered_attendees: data.registered_attendees || currentLocal?.registered_attendees || undefined,
              feedback_google_form_url: data.feedback_google_form_url || currentLocal?.feedback_google_form_url || undefined,
              feedback_google_form_edit_url: data.feedback_google_form_edit_url || currentLocal?.feedback_google_form_edit_url || undefined,
              feedback_google_form_id: data.feedback_google_form_id || currentLocal?.feedback_google_form_id || undefined,
              feedback_google_sheet_url: data.feedback_google_sheet_url || currentLocal?.feedback_google_sheet_url || undefined,
              feedback_google_sheet_id: data.feedback_google_sheet_id || currentLocal?.feedback_google_sheet_id || undefined,
              is_feedback_closed: data.is_feedback_closed ?? currentLocal?.is_feedback_closed ?? false,
              feedback_attendees: data.feedback_attendees || currentLocal?.feedback_attendees || undefined,
              winners: data.winners || currentLocal?.winners || undefined,
              certificate_templates: data.certificate_templates || currentLocal?.certificate_templates || undefined,
              certificate_writeups: data.certificate_writeups || currentLocal?.certificate_writeups || undefined,
            };
            setEvent(formatted);
            return;
          }
        } catch {
          // Fall through to sync
        }
      }

      // Fallback: trigger background sync and recheck
      syncEventsWithSupabase().then((merged) => {
        const recheck = merged.find((e) => e.id === eventId);
        if (recheck) setEvent(recheck);
      });
    };

    loadEvent();

    const handleEventsUpdated = () => {
      const fresh = getEventById(eventId);
      if (fresh) {
        setEvent((prev) => (prev ? { ...prev, ...fresh } : fresh));
      }
    };

    window.addEventListener("csi_events_updated", handleEventsUpdated);
    return () => {
      window.removeEventListener("csi_events_updated", handleEventsUpdated);
    };
  }, [eventId]);

  if (!event) {
    return (
      <div className="p-16 text-center space-y-5 max-w-md mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Loading Event Details...</h3>
        <p className="text-slate-400 text-sm">
          Fetching event configuration from Supabase and local cache.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              syncEventsWithSupabase().then(() => {
                const f = getEventById(eventId);
                if (f) setEvent(f);
              });
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/30 text-purple-200 text-xs font-semibold hover:bg-purple-600/50 border border-purple-500/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Events Archive
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const branchesString =
    event.target_branches && event.target_branches.length > 0
      ? event.target_branches.join(", ")
      : "all";

  const mockRegUrl = event.google_form_url || `https://forms.gle/csi-${event.id}`;
  const mockBitlyUrl = event.google_form_url || `https://bit.ly/csi-${event.event_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
  const mockFeedbackUrl = `https://forms.gle/csi-feedback-${event.id}`;

  const facultyCoordinator = "Faculty Coordinator";
  const formattedDateFull = formatFullDateWithDay(event.event_date);
  const timeFormatted = `${event.time_start || "11:35 AM"} – ${event.time_end || "12:30 PM"}`;
  const venueLabel = event.mode === "Online" ? "Platform" : "Venue";

  // Map coordinators with class from member database
  const getCoordinatorWithClass = (name: string) => {
    const mem = members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (mem && mem.class_batch) {
      return `${mem.name} (${mem.class_batch})`;
    }
    return name;
  };

  const coordinatorListWithClass =
    event.assigned_coordinators.length > 0
      ? event.assigned_coordinators.map(getCoordinatorWithClass)
      : ["CSI Student Coordinators"];

  // RSMS Notice description (Standard format from approved template without brief description/impromptu)
  const rsmsDescription = `The Technical Student Society is conducting ${event.mode === "Online" ? "an online competition" : "a technical event"}, ${event.event_name}, for students of all years.`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-csi-border pb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/events"
            className="w-10 h-10 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-slate-300 hover:text-white hover:border-purple-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{event.event_name}</h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border capitalize ${
                  event.status === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                }`}
              >
                {event.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {event.mode}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Event Container ID: <span className="font-mono text-purple-300 font-semibold">{event.id}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {event.status !== "completed" ? (
            <button
              onClick={() => handleUpdateStatus("completed")}
              disabled={isUpdatingStatus}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/30 border border-emerald-400/40 disabled:opacity-50"
              title="Mark event as Completed and move to Completed Archive"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Mark as Completed</span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("confirmed")}
              disabled={isUpdatingStatus}
              className="px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-amber-900/30 border border-amber-400/40 disabled:opacity-50"
              title="Reopen event into Active containers"
            >
              <RotateCcw className="w-4 h-4 text-amber-200" />
              <span>Reopen Event</span>
            </button>
          )}

          <button
            onClick={handleDeleteEvent}
            className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition"
            title="Delete this event container"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Delete Event</span>
          </button>
        </div>
      </div>

      {/* Event Overview Card with Larger Fonts */}
      <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Event Date</p>
              <p className="text-sm font-bold text-white mt-0.5">{event.event_date}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-cyan-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Time</p>
              <p className="text-sm font-bold text-white mt-0.5">{event.time_start || "01:30 PM"} - {event.time_end || "04:30 PM"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-amber-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Venue</p>
              <p className="text-sm font-bold text-white mt-0.5">{event.venue}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-emerald-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Coordinators</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {event.assigned_coordinators.length} of {event.required_coordinators} assigned
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Coordinators */}
        <div className="pt-4 border-t border-purple-500/20 flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-300">Assigned Team:</span>
          {event.assigned_coordinators.length > 0 ? (
            event.assigned_coordinators.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-900/40 text-purple-200 border border-purple-500/40"
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-sm text-amber-400 italic">No coordinators assigned yet</span>
          )}
        </div>

        {/* Target Branches */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-300">Eligible Branches:</span>
          {event.target_branches && event.target_branches.length > 0 ? (
            event.target_branches.map((b) => (
              <span
                key={b}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-mono"
              >
                {b}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">All Branches</span>
          )}
        </div>
      </div>

      {/* Auto-Generated Documents Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Auto-Generated Documents &amp; Operations Pipeline
        </h2>

        <div className="space-y-6">
          {/* RSMS Notice */}
          <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-lg font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-300" />
                RSMS Notice (Official Black &amp; White)
              </span>

              {/* Document Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    exportRsmsPdf(
                      `RSMS_Notice_${event.event_name}`,
                      event.event_name,
                      formattedDateFull,
                      timeFormatted,
                      event.venue,
                      venueLabel,
                      rsmsDescription,
                      coordinatorListWithClass,
                      facultyCoordinator,
                      mockBitlyUrl
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-[16px] font-bold flex items-center gap-2 transition shadow"
                  title="Direct Download as PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() =>
                    exportRsmsWord(
                      `RSMS_Notice_${event.event_name}`,
                      event.event_name,
                      formattedDateFull,
                      timeFormatted,
                      event.venue,
                      venueLabel,
                      rsmsDescription,
                      coordinatorListWithClass,
                      facultyCoordinator,
                      mockBitlyUrl
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-[16px] font-bold flex items-center gap-2 transition shadow"
                  title="Direct Download as Word (.doc)"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Word</span>
                </button>
              </div>
            </div>

            {/* Exact RSMS Notice Preview (Pure Black/White with Clickable Blue Link) */}
            <div className="bg-black p-6 rounded-xl border border-white/20 text-white font-serif text-[17px] leading-relaxed shadow-inner space-y-4">
              <p className="font-bold underline text-xl tracking-wide">{event.event_name}</p>

              <p className="text-justify leading-relaxed">{rsmsDescription}</p>

              <div className="space-y-1.5 font-bold">
                <p>Date: {formattedDateFull}</p>
                <p>Time: {timeFormatted}</p>
                <p>{venueLabel}: {event.venue}</p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">Student Coordinators:</p>
                <div className="space-y-1 pl-1">
                  {coordinatorListWithClass.map((c) => (
                    <p key={c}>{c}</p>
                  ))}
                </div>
              </div>

              <p>Faculty Coordinator: {facultyCoordinator}</p>

              <p>
                Registration Link:{" "}
                <a
                  href={mockBitlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-sans font-medium"
                >
                  {mockBitlyUrl}
                </a>
              </p>
            </div>
          </div>

          {/* Permission Letter */}
          <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-lg font-bold text-cyan-300 tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Permission Letter to Principal
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    exportPermissionPdf(
                      `Permission_Letter_${event.event_name}`,
                      event.event_name,
                      formattedDateFull,
                      timeFormatted,
                      event.venue,
                      event.brief_description || "",
                      branchesString,
                      facultyCoordinator
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[16px] font-bold flex items-center gap-2 transition shadow"
                  title="Direct Download as PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() =>
                    exportPermissionWord(
                      `Permission_Letter_${event.event_name}`,
                      event.event_name,
                      formattedDateFull,
                      timeFormatted,
                      event.venue,
                      event.brief_description || "",
                      branchesString,
                      facultyCoordinator
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-[16px] font-bold flex items-center gap-2 transition shadow"
                  title="Direct Download as Word (.doc)"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Word</span>
                </button>
              </div>
            </div>

            {/* Exact Permission Letter Preview */}
            <div className="bg-black p-6 rounded-xl border border-white/20 text-white font-serif text-[17px] leading-relaxed shadow-inner space-y-4">
              <div className="space-y-1">
                <p>To</p>
                <p>The Principal,</p>
                <p>College of Engineering &amp; Technology,</p>
                <p>University Campus.</p>
              </div>

              <p className="font-bold pt-1 text-lg">
                Subject: Request for Conducting Technical Event &quot;{event.event_name}&quot;
              </p>

              <p>Respected Sir,</p>

              <p className="text-justify">
                The Technical Student Society is planning to organize a technical event titled <strong>{event.event_name}</strong>. {event.brief_description || "The event is designed to introduce participants to core Computer Science concepts and technical skills through interactive sessions and challenges."}
              </p>

              <p className="text-justify">
                The event is open to students from the <strong>{branchesString}</strong> departments and will be conducted in the <strong>{event.venue}</strong> using a software-based platform developed by the Technical Student Society.
              </p>

              <p>We kindly request your permission to conduct this event as per the details given below:</p>

              <div className="space-y-1 font-bold text-left">
                <p>Event: {event.event_name}</p>
                <p>Date: {formattedDateFull}</p>
                <p>Time: {timeFormatted}</p>
                <p>Venue: {event.venue}</p>
              </div>

              <p>We hope for your kind support and approval for the successful conduct of the event.</p>

              <div className="pt-2 space-y-1">
                <p>Yours faithfully,</p>
                <p className="font-bold pt-2">{facultyCoordinator}</p>
                <p>Faculty Coordinator</p>
                <p>Technical Student Society</p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-lg font-bold text-amber-300 tracking-wide flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-amber-400" />
                  Registration Form
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowRegPreview(!showRegPreview)}
                    className="text-[13px] px-3 py-1 rounded-full bg-purple-900/40 hover:bg-purple-800 text-purple-200 font-bold border border-purple-500/40 flex items-center gap-1.5 transition"
                  >
                    {showRegPreview ? <EyeOff className="w-3.5 h-3.5 text-purple-300" /> : <Eye className="w-3.5 h-3.5 text-purple-300" />}
                    <span>{showRegPreview ? "Hide Preview" : "Show Preview"}</span>
                  </button>
                  {event.google_form_url && (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-cyan-400" />
                      Live in CSI Drive
                    </span>
                  )}
                  {event.is_registration_closed ? (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      Registration Closed
                    </span>
                  ) : event.google_form_url ? (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Registration Open
                    </span>
                  ) : null}
                  {event.registered_attendees && event.registered_attendees.length > 0 ? (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {event.registered_attendees.length} Synced
                    </span>
                  ) : (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Awaiting Sheet Sync
                    </span>
                  )}
                </div>
              </div>

              {/* Status / Drive feedback notice */}
              {driveActionNotice && (
                <div
                  className={`p-3.5 mb-3 rounded-xl text-[15px] font-semibold flex items-center gap-2.5 border ${
                    driveActionNotice.type === "success"
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                      : "bg-red-950/60 border-red-500/50 text-red-300"
                  }`}
                >
                  {driveActionNotice.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{driveActionNotice.text}</span>
                </div>
              )}

              {/* Active Drive Links when Form is Created */}
              {event.google_form_url && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3 mb-3 text-[15px]">
                  <span className="font-bold text-white block">Connected CSI Drive Assets:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsSimulatedFormOpen(true)}
                      className="p-3 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-400/50 text-white flex items-center gap-2 transition font-bold shadow-md text-left"
                      title="Open interactive simulated Google Form"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="truncate">Open Form Simulation</span>
                    </button>
                    {event.google_form_edit_url && (
                      <a
                        href={event.google_form_edit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-black/60 hover:bg-black border border-purple-500/30 text-purple-300 hover:text-purple-200 flex items-center gap-2 transition font-semibold"
                      >
                        <FileCode className="w-4 h-4 text-purple-400" />
                        <span className="truncate">Edit in Forms</span>
                      </a>
                    )}
                    {event.google_sheet_url && (
                      <a
                        href={event.google_sheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-black/60 hover:bg-black border border-purple-500/30 text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition font-semibold"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="truncate">Responses Sheet</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Form Questions Overview (Toggled via Show Preview) */}
              {showRegPreview && (
                <div className="bg-black p-5 rounded-xl border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/20">
                    <span className="font-bold text-slate-200 text-[17px]">Official Form Questions (10 Fields):</span>
                    <span className="text-[14px] px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                      All Required except CSI ID
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[17px]">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">1.</span>
                      <span className="font-bold text-white">Email</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">2.</span>
                      <span className="font-bold text-white">Title</span>
                      <span className="text-red-400 font-bold">*</span>
                      <span className="text-slate-400 text-[15px] font-normal">(Mr / Ms)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">3.</span>
                      <span className="font-bold text-white">Name</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">4.</span>
                      <span className="font-bold text-white">College Email ID</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">5.</span>
                      <span className="font-bold text-white">Contact No.(Preferably WhatsApp)</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">6.</span>
                      <span className="font-bold text-white">Year of study</span>
                      <span className="text-red-400 font-bold">*</span>
                      <span className="text-slate-400 text-[15px] font-normal">(1st – 4th yr)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">7.</span>
                      <span className="font-bold text-white">Department</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">8.</span>
                      <span className="font-bold text-white">Division</span>
                      <span className="text-red-400 font-bold">*</span>
                      <span className="text-slate-400 text-[15px] font-normal">(Alpha - Nil)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold font-mono">9.</span>
                      <span className="font-bold text-white">Are you a CSI member?</span>
                      <span className="text-red-400 font-bold">*</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                      <span className="text-slate-500 font-bold font-mono">10.</span>
                      <span className="font-bold text-white">If yes, enter CSI membership id</span>
                      <span className="text-slate-400 text-[15px] font-normal">(Optional)</span>
                    </div>
                  </div>

                  {/* Dynamic Departments based on event container */}
                  <div className="pt-3 border-t border-purple-500/20 space-y-2">
                    <span className="text-[17px] text-slate-300 font-semibold block">
                      Dynamic Department Options (injected from event branches):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {eventDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="px-3.5 py-1.5 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-[15px]"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1-Click Create Form in Drive */}
                {!event.google_form_url ? (
                  <button
                    onClick={handleCreateFormInDrive}
                    disabled={isCreatingFormInDrive}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-[16px] font-extrabold flex items-center gap-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    {isCreatingFormInDrive ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Creating Form in CSI Drive...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>Create Form in Drive</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {/* Interactive Form Simulator Button */}
                    <button
                      type="button"
                      onClick={() => setIsSimulatedFormOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-purple-700/80 hover:bg-purple-600 text-white text-[15px] font-bold flex items-center gap-2 transition border border-purple-400/40 shadow"
                      title="Open interactive simulated form to submit sample students"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Submit Test Student</span>
                    </button>

                    {/* Sync Final Roster after Form Closes */}
                    <button
                      onClick={handleSyncFinalRosterFromDrive}
                      disabled={isSyncingFromDrive}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[16px] font-extrabold flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                      title="Fetch final responses from Google Sheet into Attendance Sheet"
                    >
                      {isSyncingFromDrive ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Fetching Final Roster...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>Sync Final Roster to Attendance</span>
                        </>
                      )}
                    </button>

                    {/* Toggle Registration Closed / Open */}
                    <button
                      onClick={handleToggleRegistrationStatus}
                      disabled={isTogglingRegistration}
                      className={`px-4 py-2.5 rounded-xl text-[16px] font-bold border transition flex items-center gap-2 ${
                        event.is_registration_closed
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
                          : "bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-500/40"
                      }`}
                    >
                      {isTogglingRegistration ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      <span>{event.is_registration_closed ? "Re-open Form" : "Close Registration"}</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => copyToClipboard(event.google_form_url || mockRegUrl, "regUrl")}
                className="text-[16px] text-amber-300 hover:text-white font-bold underline"
              >
                {copiedSection === "regUrl" ? "Copied Link!" : "Copy Public Link"}
              </button>
            </div>
          </div>

          {/* Feedback Form & QR Code */}
          <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-lg font-bold text-pink-300 tracking-wide flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-pink-400" />
                  Feedback Form &amp; QR Code
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackPreview(!showFeedbackPreview)}
                    className="text-[13px] px-3 py-1 rounded-full bg-pink-900/40 hover:bg-pink-800 text-pink-200 font-bold border border-pink-500/40 flex items-center gap-1.5 transition"
                  >
                    {showFeedbackPreview ? <EyeOff className="w-3.5 h-3.5 text-pink-300" /> : <Eye className="w-3.5 h-3.5 text-pink-300" />}
                    <span>{showFeedbackPreview ? "Hide Preview" : "Show Preview"}</span>
                  </button>
                  {event.is_feedback_closed ? (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      Feedback Closed
                    </span>
                  ) : event.feedback_google_form_url ? (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Feedback Open
                    </span>
                  ) : null}
                  {event.feedback_attendees && event.feedback_attendees.length > 0 && (
                    <span className="text-[14px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {event.feedback_attendees.length} Verified for Certificates
                    </span>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              {feedbackActionNotice && (
                <div
                  className={`p-3.5 mb-3 rounded-xl text-[15px] font-semibold flex items-center gap-2.5 border ${
                    feedbackActionNotice.type === "success"
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                      : "bg-red-950/60 border-red-500/50 text-red-300"
                  }`}
                >
                  {feedbackActionNotice.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{feedbackActionNotice.text}</span>
                </div>
              )}

              {/* Connected Drive Assets */}
              {event.feedback_google_form_url && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3 mb-3 text-[15px]">
                  <span className="font-bold text-white block">Connected CSI Drive Feedback Assets:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsSimulatedFeedbackOpen(true)}
                      className="p-3 rounded-lg bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 border border-emerald-400/50 text-white flex items-center gap-2 transition font-bold shadow-md text-left"
                      title="Open interactive simulated Feedback Form"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="truncate">Open Feedback Simulation</span>
                    </button>
                    {event.feedback_google_form_edit_url && (
                      <a
                        href={event.feedback_google_form_edit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-black/60 hover:bg-black border border-purple-500/30 text-purple-300 hover:text-purple-200 flex items-center gap-2 transition font-semibold"
                      >
                        <FileCode className="w-4 h-4 text-purple-400" />
                        <span className="truncate">Edit in Forms</span>
                      </a>
                    )}
                    {event.feedback_google_sheet_url && (
                      <a
                        href={event.feedback_google_sheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-black/60 hover:bg-black border border-purple-500/30 text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition font-semibold"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="truncate">Responses Sheet</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Projector Display Ready QR Code with Direct Download */}
              <div className="bg-slate-950 p-6 rounded-xl border border-pink-500/30 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-32 h-32 bg-white p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xl border border-white/20">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt={`${event.event_name} Feedback QR Code`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-24 h-24 text-black" />
                    )}
                  </div>

                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <p className="text-cyan-300 font-mono text-[17px] break-all">
                      {event.feedback_google_form_url || mockFeedbackUrl}
                    </p>

                    <div className="pt-1 flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                      {qrDataUrl && (
                        <a
                          href={qrDataUrl}
                          download={`${event.event_name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Feedback_QR.png`}
                          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[15px] font-bold inline-flex items-center gap-2 transition shadow shadow-pink-600/30"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download QR Code (PNG)</span>
                        </a>
                      )}
                      <button
                        onClick={() =>
                          copyToClipboard(event.feedback_google_form_url || mockFeedbackUrl, "feedUrl")
                        }
                        className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-[15px] font-bold inline-flex items-center gap-2 transition"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copiedSection === "feedUrl" ? "Copied URL!" : "Copy URL"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Overview (Toggled via Show Preview - Without Description or NBA / AICTE Banner) */}
              {showFeedbackPreview && (
                <div className="bg-black p-5 rounded-xl border border-purple-500/30 space-y-5">
                  {/* Section 1: Standard Attendee Profile (First 2 Pages) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                      <span className="font-bold text-slate-200 text-[17px]">
                        Standard Attendee Profile (8 Fields - Fixed College Format):
                      </span>
                      <span className="text-[14px] px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                        All 8 Required for Certificate Verification
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[17px]">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">1.</span>
                        <span className="font-bold text-white">Name (As required in the certificate)</span>
                        <span className="text-red-400 font-bold">*</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">2.</span>
                        <span className="font-bold text-white">UID</span>
                        <span className="text-red-400 font-bold">*</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">3.</span>
                        <span className="font-bold text-white">UID Email</span>
                        <span className="text-red-400 font-bold">*</span>
                        <span className="text-slate-400 text-[15px] font-normal">(if no then provide your personal email)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">4.</span>
                        <span className="font-bold text-white">Gender</span>
                        <span className="text-red-400 font-bold">*</span>
                        <span className="text-slate-400 text-[15px] font-normal">(Mr / Mrs)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">5.</span>
                        <span className="font-bold text-white">Year of Study</span>
                        <span className="text-red-400 font-bold">*</span>
                        <span className="text-slate-400 text-[15px] font-normal">(1st, 2nd, 3rd, 4th)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">6.</span>
                        <span className="font-bold text-white">Branch</span>
                        <span className="text-red-400 font-bold">*</span>
                        <span className="text-cyan-300 text-[15px] font-mono">({eventDepartments.join(", ")})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">7.</span>
                        <span className="font-bold text-white">Section</span>
                        <span className="text-red-400 font-bold">*</span>
                        <span className="text-slate-400 text-[15px] font-normal">(Alpha, Beta, Gamma, Delta, Nil)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono">8.</span>
                        <span className="font-bold text-white">WhatsApp No</span>
                        <span className="text-red-400 font-bold">*</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Event-Specific CO/PO Evaluation (FEEDBACK FORM) */}
                  <div className="pt-4 border-t border-purple-500/20 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20 flex-wrap gap-2">
                      <span className="font-bold text-slate-200 text-[17px]">
                        Section 2 of 2: FEEDBACK FORM (Event-Specific CO / PO Evaluation)
                      </span>
                    </div>

                    <div className="space-y-4">
                      {activeFeedbackQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/20 space-y-2 text-[17px]"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 font-bold font-mono">{idx + 1}.</span>
                              <span className="font-bold text-white">{q.title}</span>
                              <span className="text-red-400 font-bold">*</span>
                            </div>
                            {q.po_mapping && q.po_mapping.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                {q.po_mapping.map((po) => (
                                  <span
                                    key={po}
                                    className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                                    title={PO_DEFINITIONS[po]?.title || po}
                                  >
                                    {po}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <p className="text-slate-300 text-[16px] leading-relaxed pl-5">
                            {q.description}
                          </p>

                          {q.type === "likert_scale" ? (
                            <div className="pl-5 pt-2 flex flex-wrap gap-2 sm:gap-4 text-xs font-semibold text-slate-400">
                              {["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((opt) => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-default">
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block" />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="pl-5 pt-2">
                              <div className="p-2.5 rounded-lg bg-black border border-white/10 text-xs text-slate-500 italic">
                                [Long answer text (Paragraph response)]
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1-Click Create Feedback Form in Drive */}
                {!event.feedback_google_form_url ? (
                  <button
                    onClick={handleCreateFeedbackInDrive}
                    disabled={isCreatingFeedbackInDrive}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-[16px] font-extrabold flex items-center gap-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    {isCreatingFeedbackInDrive ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Creating Feedback Form in CSI Drive...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>Create Feedback Form in Drive</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {/* Interactive Feedback Simulator Button */}
                    <button
                      type="button"
                      onClick={() => setIsSimulatedFeedbackOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-[15px] font-bold flex items-center gap-2 transition border border-emerald-400/40 shadow"
                      title="Open interactive simulated form to submit sample feedback"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Submit Test Feedback</span>
                    </button>

                    {/* Sync Feedback Responses to Certificates */}
                    <button
                      onClick={handleSyncFeedbackFromDrive}
                      disabled={isSyncingFeedbackFromDrive}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[16px] font-extrabold flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                      title="Fetch responses from Google Sheet into Certificate Pipeline"
                    >
                      {isSyncingFeedbackFromDrive ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Syncing Responses...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>Sync Sheet Responses</span>
                        </>
                      )}
                    </button>

                    {/* Open Certificate Studio in New Dedicated Page */}
                    <Link
                      href={`/events/${event.id}/certificates`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white text-[16px] font-extrabold flex items-center gap-2 transition shadow-lg shadow-amber-600/30"
                      title="Open Certificate Studio to assign winners, upload templates, and download ZIP folders"
                    >
                      <Trophy className="w-5 h-5 text-amber-200" />
                      <span>Certificate Studio &rarr;</span>
                    </Link>

                    {/* Toggle Feedback Status */}
                    <button
                      onClick={handleToggleFeedbackStatus}
                      disabled={isTogglingFeedback}
                      className={`px-4 py-2.5 rounded-xl text-[16px] font-bold border transition flex items-center gap-2 ${
                        event.is_feedback_closed
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
                          : "bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-500/40"
                      }`}
                    >
                      {isTogglingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>{event.is_feedback_closed ? "Re-open Feedback" : "Close Feedback Form"}</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() =>
                  copyToClipboard(event.feedback_google_form_url || mockFeedbackUrl, "feedUrl")
                }
                className="text-[16px] text-pink-300 hover:text-white font-bold underline"
              >
                {copiedSection === "feedUrl" ? "Copied URL!" : "Copy Public Link"}
              </button>
            </div>
          </div>

        {/* Phase 5: Certificate Generation Studio Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-[#12101C] rounded-2xl border border-amber-500/40 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Phase 5 • Attendees &amp; Winners
              </span>
              {event.feedback_attendees && event.feedback_attendees.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {event.feedback_attendees.length} Verified Attendees Synced
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 pt-1">
              <Trophy className="w-6 h-6 text-amber-400" />
              Certificate Generation &amp; Winner Recognition Studio
            </h3>
            <p className="text-slate-300 text-[15px]">
              Multi-select 1st, 2nd, and 3rd place winners, upload custom templates for Appreciation &amp; Participation, customize write-ups, and download the two organized zip folders.
            </p>
          </div>
          <Link
            href={`/events/${event.id}/certificates`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-[16px] font-extrabold flex items-center justify-center gap-2.5 transition shadow-xl shadow-amber-600/25 shrink-0"
          >
            <span>Open Certificate Studio</span>
            <Award className="w-5 h-5" />
          </Link>
        </div>

        {/* Attendance Sheet - Only for Offline events */}
        {event.mode === "Online" ? (
          <div className="bg-[#12101C] rounded-2xl border border-cyan-500/30 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    Attendance Sheet Not Applicable
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Online Mode
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Physical sign-in attendance sheets are only generated for on-campus / offline events. For online events, attendance is tracked digitally through platform logs and the feedback responses form below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-emerald-400 tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Attendance Sheet (With Society Emblems)
              </h3>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {event.registered_attendees && event.registered_attendees.length > 0 && (
                <button
                  onClick={handleClearAttendees}
                  className="px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-[16px] font-bold transition"
                  title="Clear attendees and revert to blank roster"
                >
                  Reset Roster
                </button>
              )}
              <button
                onClick={() =>
                  exportAttendancePdf(
                    `Attendance_Sheet_${event.event_name}`,
                    event.event_name,
                    event.event_date,
                    event.venue,
                    event.assigned_coordinators,
                    event.registered_attendees
                  )
                }
                className="px-4 py-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 text-[16px] font-bold flex items-center gap-2 transition shadow"
                title="Direct Download Attendance Sheet as PDF"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() =>
                  exportAttendanceWord(
                    `Attendance_Sheet_${event.event_name}`,
                    event.event_name,
                    event.event_date,
                    event.venue,
                    event.assigned_coordinators,
                    event.registered_attendees
                  )
                }
                className="px-4 py-2 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-[16px] font-bold flex items-center gap-2 transition shadow"
                title="Direct Download Attendance Sheet as Word (.doc)"
              >
                <FileDown className="w-4 h-4" />
                <span>Download Word</span>
              </button>
            </div>
          </div>

          {/* Official Document Sheet Preview (Matches Exact Scanned Format) */}
          <div
            className="bg-white text-black p-6 sm:p-9 rounded-xl border border-slate-300 shadow-2xl overflow-x-auto"
            style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
          >
            {/* Header with Logos */}
            <div className="flex items-center justify-between pb-3 mb-6 gap-4">
              <div className="w-24 shrink-0 flex items-center justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/sample_institute_logo.png"
                  alt="Institute Logo"
                  className="h-20 w-auto object-contain"
                />
              </div>

              <div className="text-center flex-1 space-y-1.5">
                <h4 className="text-lg sm:text-[20px] font-bold tracking-normal uppercase text-black">
                  TECHNICAL STUDENT SOCIETY
                </h4>
                <p className="text-base sm:text-[18px] font-bold tracking-wide text-black">
                  ATTENDANCE SHEET
                </p>
              </div>

              <div className="w-24 shrink-0 flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/sample_club_logo.png"
                  alt="Club Logo"
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>

            {/* Metadata Grid in Calibri */}
            <div
              className="space-y-1.5 text-[17px] text-black mb-5 pl-0.5 leading-snug"
              style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
            >
              <div className="flex items-start py-0.5">
                <span className="w-52 font-bold shrink-0 text-[17px]">EVENT NAME</span>
                <span className="font-bold text-[17px]">: {event.event_name.toUpperCase()}</span>
              </div>
              <div className="flex items-start py-0.5">
                <span className="w-52 font-bold shrink-0 text-[17px]">DATE</span>
                <span className="font-bold text-[17px]">: {formatShortSlashDate(event.event_date)}</span>
              </div>
              <div className="flex items-start py-0.5">
                <span className="w-52 font-bold shrink-0 text-[17px]">VENUE</span>
                <span className="font-bold text-[17px]">: {event.venue}</span>
              </div>
              <div className="flex items-start py-0.5">
                <span className="w-52 font-bold shrink-0 text-[17px]">COORDINATORS</span>
                <span className="font-bold text-[17px]">: {event.assigned_coordinators.join(", ") || "CSI Coordinators"}</span>
              </div>
              <div className="flex items-start py-0.5">
                <span className="w-52 font-bold shrink-0 text-[17px]">No. of participants</span>
                <span className="font-bold text-[17px]">: {event.registered_attendees && event.registered_attendees.length > 0 ? event.registered_attendees.length : "__________________"}</span>
              </div>
            </div>

            {/* Attendance Roster Table with Proportional Column Widths */}
            <table className="w-full text-[17px] text-left border-collapse border border-black table-fixed">
              <thead>
                <tr className="border-b border-black text-black font-bold uppercase text-center bg-white text-[17px]">
                  <th className="border border-black py-2.5 px-2 w-[10%] text-center text-[17px]">SL NO</th>
                  <th className="border border-black py-2.5 px-3 w-[34%] text-left text-[17px]">NAME</th>
                  <th className="border border-black py-2.5 px-2 w-[16%] text-center text-[17px]">GENDER</th>
                  <th className="border border-black py-2.5 px-2 w-[16%] text-center text-[17px]">CLASS</th>
                  <th className="border border-black py-2.5 px-2 w-[24%] text-center text-[17px]">SIGNATURE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black text-[17px]">
                {(event.registered_attendees && event.registered_attendees.length > 0
                  ? event.registered_attendees
                  : [1, 2, 3, 4, 5, 6, 7]
                ).map((item, idx) => {
                  const isAttendee = typeof item === "object";
                  return (
                    <tr key={idx} className="h-10 text-[17px]">
                      <td className="border border-black text-center py-2 px-2 font-bold text-[17px]">{idx + 1}</td>
                      <td className="border border-black py-2 px-3 text-left text-[17px]">{isAttendee ? item.name : "\u00A0"}</td>
                      <td className="border border-black text-center py-2 px-2 text-[17px]">{isAttendee ? item.gender || "" : "\u00A0"}</td>
                      <td className="border border-black text-center py-2 px-2 text-[17px]">{isAttendee ? item.class_batch || "" : "\u00A0"}</td>
                      <td className="border border-black py-2 px-2 text-[17px]">&nbsp;</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
      </div>

      {/* GOOGLE APPS SCRIPT GENERATOR MODAL */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12101C] border border-purple-500/40 w-full max-w-3xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <FileCode className="w-5 h-5 text-purple-400" />
                <span>Google Apps Script — 1-Click Form &amp; Sheet Generator</span>
              </div>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
                <p className="font-bold text-purple-200 text-sm">
                  Run directly inside your CSI Gmail Drive (script.google.com)
                </p>
                <p className="text-slate-300 leading-relaxed">
                  This custom script builds the exact 10-question registration form in your CSI Drive, injects only the eligible departments (<strong>{eventDepartments.join(", ")}</strong>), creates the responses Google Sheet, and automatically links them together!
                </p>
              </div>

              {/* Step by Step Instructions */}
              <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">How to Run in 4 Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>
                    Open Google Drive in your CSI Gmail account, then visit{" "}
                    <a
                      href="https://script.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-semibold"
                    >
                      script.google.com
                    </a>{" "}
                    and click <strong>+ New project</strong>.
                  </li>
                  <li>
                    In the code editor, delete any existing text, paste the script below, and click <strong>Save</strong> (💾).
                  </li>
                  <li>
                    Click <strong>Run</strong>. When prompted for authorization, click <em>Review permissions</em> &gt; <em>Advanced</em> &gt; <em>Go to Untitled project (unsafe)</em> &gt; <em>Allow</em>.
                  </li>
                  <li>
                    Check the <strong>Execution log</strong> at the bottom of the screen: It outputs your <strong>Live Form Link</strong>, <strong>Form Edit Link</strong>, and <strong>Responses Google Sheet Link</strong>.
                  </li>
                </ol>
              </div>

              {/* Code Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">Code.gs (Auto-Tailored for {event.event_name})</span>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1 rounded bg-purple-600/40 hover:bg-purple-600 text-purple-200 hover:text-white font-bold flex items-center gap-1.5 transition"
                  >
                    {scriptCopied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-black border border-purple-500/30 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-64 leading-relaxed select-all">
                  {eventScriptCode}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Department options: {eventDepartments.join(", ")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{scriptCopied ? "Copied!" : "Copy Full Script"}</span>
                </button>
                <button
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE SHEET REGISTRATIONS IMPORT MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12101C] border border-purple-500/40 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Connect Google Sheet / Import Registrations</span>
              </div>
              <button
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setSyncStatus(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="leading-relaxed text-xs text-slate-400">
                Paste your CSI Drive Google Sheet share link or paste copied table rows (from your CSI Gmail Drive).
                The system maps <strong>Name</strong>, <strong>Gender</strong>, and <strong>Class</strong> into the Attendance Sheet.
              </p>

              <form onSubmit={handleSyncData} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                    Google Sheet Share Link OR Pasted CSV / TSV Rows
                  </label>
                  <textarea
                    rows={4}
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="e.g. https://docs.google.com/spreadsheets/d/.../edit or paste Name, Gender, Class rows..."
                    className="w-full bg-black border border-purple-500/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                {syncStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                      syncStatus.success
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                        : "bg-red-950/60 border-red-500/50 text-red-300"
                    }`}
                  >
                    {syncStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{syncStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApplySampleAttendees}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 text-xs font-bold transition"
                  >
                    Quick Test (Load 7 Scan Attendees)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSyncModalOpen(false);
                        setSyncStatus(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSyncing || !sheetInput.trim()}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      {isSyncing ? "Mapping..." : "Sync Attendees"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK GOOGLE APPS SCRIPT GENERATOR MODAL */}
      {isFeedbackScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12101C] border border-pink-500/40 w-full max-w-3xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <FileCode className="w-5 h-5 text-pink-400" />
                <span>Google Apps Script — 2-Page Feedback Form &amp; Responses Generator</span>
              </div>
              <button
                onClick={() => setIsFeedbackScriptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-1.5">
                <p className="font-bold text-pink-200 text-sm">
                  Run directly in your CSI Gmail Drive (script.google.com)
                </p>
                <p className="text-slate-300 leading-relaxed">
                  This custom script builds the exact 2-section feedback form (Section 1: 8 participant fields for certificates, Section 2: CO/PO Likert questions), creates the linked responses Google Sheet, and sets up your automated certificate pipeline!
                </p>
              </div>

              {/* Step by Step Instructions */}
              <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">How to Run in 4 Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>
                    Open Google Drive in your CSI Gmail account, then visit{" "}
                    <a
                      href="https://script.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-semibold"
                    >
                      script.google.com
                    </a>{" "}
                    and click <strong>+ New project</strong>.
                  </li>
                  <li>
                    In the code editor, delete any existing text, paste the script below, and click <strong>Save</strong> (💾).
                  </li>
                  <li>
                    Click <strong>Run</strong>. When prompted for authorization, click <em>Review permissions</em> &gt; <em>Advanced</em> &gt; <em>Go to Untitled project (unsafe)</em> &gt; <em>Allow</em>.
                  </li>
                  <li>
                    Check the <strong>Execution log</strong> at the bottom of the screen: It gives you the <strong>Live Form Link</strong>, <strong>Form Edit Link</strong>, and <strong>Responses Google Sheet Link</strong>.
                  </li>
                </ol>
              </div>

              {/* Code Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">FeedbackScript.gs (Auto-Tailored with CO/PO Mapping)</span>
                  <button
                    onClick={handleCopyFeedbackScript}
                    className="px-3 py-1 rounded bg-pink-600/40 hover:bg-pink-600 text-pink-200 hover:text-white font-bold flex items-center gap-1.5 transition"
                  >
                    {feedbackScriptCopied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-black border border-pink-500/30 text-[11px] text-pink-300 font-mono overflow-x-auto max-h-64 leading-relaxed select-all">
                  {feedbackScriptCode}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Contains {activeFeedbackQuestions.length} evaluation questions + 8 student profile fields
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFeedbackScript}
                  className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{feedbackScriptCopied ? "Copied!" : "Copy Full Script"}</span>
                </button>
                <button
                  onClick={() => setIsFeedbackScriptModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK SHEET RESPONSES IMPORT MODAL */}
      {isFeedbackSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12101C] border border-emerald-500/40 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Connect Google Sheet / Import Feedback Responses</span>
              </div>
              <button
                onClick={() => {
                  setIsFeedbackSyncModalOpen(false);
                  setFeedbackSyncStatus(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="leading-relaxed text-xs text-slate-400">
                Paste your Feedback Responses Google Sheet share link or paste copied table rows directly. The system extracts <strong>Name (As required in the certificate)</strong>, <strong>UID</strong>, <strong>Gender</strong>, <strong>Branch</strong>, and <strong>Year</strong> into the Certificate Pipeline.
              </p>

              <form onSubmit={handleSyncFeedbackData} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                    Google Sheet Share Link OR Pasted CSV / TSV Rows
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackSheetInput}
                    onChange={(e) => setFeedbackSheetInput(e.target.value)}
                    placeholder="e.g. https://docs.google.com/spreadsheets/d/.../edit or paste responses rows..."
                    className="w-full bg-black border border-purple-500/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                {feedbackSyncStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                      feedbackSyncStatus.success
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                        : "bg-red-950/60 border-red-500/50 text-red-300"
                    }`}
                  >
                    {feedbackSyncStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{feedbackSyncStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApplySampleFeedback}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 text-xs font-bold transition"
                  >
                    Quick Test (Load 8 Submissions)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFeedbackSyncModalOpen(false);
                        setFeedbackSyncStatus(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isFeedbackSyncing || !feedbackSheetInput.trim()}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      {isFeedbackSyncing ? "Mapping..." : "Sync Responses"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Form Simulator Modals (Registration & Feedback) */}
      {event && (
        <>
          <SimulatedFormModal
            isOpen={isSimulatedFormOpen}
            onClose={() => setIsSimulatedFormOpen(false)}
            event={event}
            mode="registration"
            onRegisteredSuccess={handleSimulatedRegistered}
          />
          <SimulatedFormModal
            isOpen={isSimulatedFeedbackOpen}
            onClose={() => setIsSimulatedFeedbackOpen(false)}
            event={event}
            mode="feedback"
            onFeedbackSuccess={handleSimulatedFeedback}
          />
        </>
      )}
    </div>
  );
}

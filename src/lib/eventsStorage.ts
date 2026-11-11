"use client";

import { CSIEvent, Member } from "./types";
import { events as initialEvents, members as initialMembers } from "./data";
import { supabase } from "./supabaseClient";

export const EVENTS_STORAGE_KEY = "csi_operations_events";
export const MEMBERS_STORAGE_KEY = "csi_operations_members";

let lastEventsSyncTime = 0;
let lastMembersSyncTime = 0;
let isSyncingEvents = false;
let isSyncingMembers = false;

// Helper to safely generate standard UUIDs for database compatibility
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "e" + Date.now();
}

/**
 * Fetch and sync events from Supabase in the background, updating localStorage
 * and broadcasting a 'csi_events_updated' custom event.
 */
export async function syncEventsWithSupabase(): Promise<CSIEvent[]> {
  if (!supabase || typeof window === "undefined" || isSyncingEvents) {
    return getStoredEvents();
  }

  isSyncingEvents = true;
  try {
    const { data: dbEvents, error: eErr } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (eErr || !dbEvents || dbEvents.length === 0) {
      isSyncingEvents = false;
      return getStoredEvents();
    }

    // Also fetch coordinator assignments if junction table exists
    let coordMap: Record<string, string[]> = {};
    try {
      const { data: junctions } = await supabase
        .from("event_coordinators")
        .select("event_id, members(name)");

      if (junctions && junctions.length > 0) {
        junctions.forEach((j: any) => {
          if (j.event_id && j.members?.name) {
            if (!coordMap[j.event_id]) coordMap[j.event_id] = [];
            coordMap[j.event_id].push(j.members.name);
          }
        });
      }
    } catch {
      // Ignore if junction table is not used
    }

    // Merge Supabase events with local rich defaults (venue, time, mode, etc.)
    const localEvents = getStoredEvents();
    const mergedEvents: CSIEvent[] = dbEvents.map((dbRow: any) => {
      // Find matching local or initial event by id or name for fallback rich fields
      const fallback =
        localEvents.find((e) => e.id === dbRow.id || e.event_name === dbRow.event_name) ||
        initialEvents.find((e) => e.event_name === dbRow.event_name);

      const assignedCoords =
        (Array.isArray(dbRow.assigned_coordinators) && dbRow.assigned_coordinators.length > 0
          ? dbRow.assigned_coordinators
          : coordMap[dbRow.id]) ||
        fallback?.assigned_coordinators ||
        [];

      return {
        id: dbRow.id,
        event_name: dbRow.event_name || fallback?.event_name || "Untitled Event",
        event_date: dbRow.event_date || fallback?.event_date || new Date().toISOString().split("T")[0],
        time_start: dbRow.time_start || fallback?.time_start || "09:30 AM",
        time_end: dbRow.time_end || fallback?.time_end || "04:30 PM",
        mode: (dbRow.mode || fallback?.mode || "Offline") as "Offline" | "Online",
        venue: dbRow.venue || fallback?.venue || "Auditorium",
        target_branches: dbRow.target_branches || fallback?.target_branches || ["CSE", "CSBS", "IT", "AD"],
        faculty_in_charge: dbRow.faculty_in_charge || fallback?.faculty_in_charge || "Faculty Coordinator",
        brief_description: dbRow.brief_description || fallback?.brief_description || "",
        status: (dbRow.status || fallback?.status || "confirmed") as "planned" | "confirmed" | "completed",
        required_coordinators: Number(dbRow.required_coordinators) || fallback?.required_coordinators || 2,
        assigned_coordinators: assignedCoords,
        google_form_url: dbRow.google_form_url || fallback?.google_form_url,
        google_form_edit_url: dbRow.google_form_edit_url || fallback?.google_form_edit_url,
        google_form_id: dbRow.google_form_id || fallback?.google_form_id,
        google_sheet_url: dbRow.google_sheet_url || fallback?.google_sheet_url,
        google_sheet_id: dbRow.google_sheet_id || fallback?.google_sheet_id,
        is_registration_closed: dbRow.is_registration_closed ?? fallback?.is_registration_closed ?? false,
        registered_attendees: dbRow.registered_attendees || fallback?.registered_attendees || [],
        feedback_google_form_url: dbRow.feedback_google_form_url || fallback?.feedback_google_form_url,
        feedback_google_form_edit_url: dbRow.feedback_google_form_edit_url || fallback?.feedback_google_form_edit_url,
        feedback_google_form_id: dbRow.feedback_google_form_id || fallback?.feedback_google_form_id,
        feedback_google_sheet_url: dbRow.feedback_google_sheet_url || fallback?.feedback_google_sheet_url,
        feedback_google_sheet_id: dbRow.feedback_google_sheet_id || fallback?.feedback_google_sheet_id,
        is_feedback_closed: dbRow.is_feedback_closed ?? fallback?.is_feedback_closed ?? false,
        feedback_attendees: dbRow.feedback_attendees || fallback?.feedback_attendees || [],
        winners: dbRow.winners || fallback?.winners || {},
        certificate_templates: dbRow.certificate_templates || fallback?.certificate_templates,
        certificate_writeups: dbRow.certificate_writeups || fallback?.certificate_writeups,
        custom_feedback_questions: dbRow.custom_feedback_questions || fallback?.custom_feedback_questions,
      };
    });

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(mergedEvents));
    lastEventsSyncTime = Date.now();
    window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: mergedEvents }));
    return mergedEvents;
  } catch (err) {
    console.warn("Background Supabase events sync failed:", err);
    return getStoredEvents();
  } finally {
    isSyncingEvents = false;
  }
}

/**
 * Fetch and sync members from Supabase in the background, updating localStorage
 * and broadcasting a 'csi_members_updated' custom event.
 */
export async function syncMembersWithSupabase(): Promise<Member[]> {
  if (!supabase || typeof window === "undefined" || isSyncingMembers) {
    return getStoredMembers();
  }

  isSyncingMembers = true;
  try {
    const { data: dbMembers, error: mErr } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (mErr || !dbMembers || dbMembers.length === 0) {
      isSyncingMembers = false;
      return getStoredMembers();
    }

    const members: Member[] = dbMembers.map((m: any) => ({
      id: m.id,
      name: m.name,
      role: m.role || "Coordinator",
      domain: m.domain || "Operations",
      class_batch: m.class_batch || "",
      member_type: m.member_type || "new_coordinator",
      is_active: m.is_active ?? true,
      events_coordinated_count: Number(m.events_coordinated_count) || 0,
    }));

    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
    lastMembersSyncTime = Date.now();
    window.dispatchEvent(new CustomEvent("csi_members_updated", { detail: members }));
    return members;
  } catch (err) {
    console.warn("Background Supabase members sync failed:", err);
    return getStoredMembers();
  } finally {
    isSyncingMembers = false;
  }
}

export function getStoredEvents(): CSIEvent[] {
  if (typeof window === "undefined") return initialEvents;
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  let currentEvents: CSIEvent[] = initialEvents;

  if (!stored) {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEvents));
  } else {
    try {
      currentEvents = JSON.parse(stored);
    } catch {
      currentEvents = initialEvents;
    }
  }

  // Trigger background Supabase refresh if 20 seconds have elapsed since last sync
  if (supabase && Date.now() - lastEventsSyncTime > 20000 && !isSyncingEvents) {
    syncEventsWithSupabase().catch(() => {});
  }

  return currentEvents;
}

export function getStoredMembers(): Member[] {
  if (typeof window === "undefined") return initialMembers;
  const stored = localStorage.getItem(MEMBERS_STORAGE_KEY);
  let currentMembers: Member[] = initialMembers;

  if (!stored) {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(initialMembers));
  } else {
    try {
      currentMembers = JSON.parse(stored);
    } catch {
      currentMembers = initialMembers;
    }
  }

  // Trigger background Supabase refresh if 20 seconds have elapsed since last sync
  if (supabase && Date.now() - lastMembersSyncTime > 20000 && !isSyncingMembers) {
    syncMembersWithSupabase().catch(() => {});
  }

  return currentMembers;
}

export function saveNewEvent(newEvent: Omit<CSIEvent, "id">): CSIEvent {
  const currentEvents = getStoredEvents();
  const currentMembers = getStoredMembers();

  const id = generateId();
  const created: CSIEvent = {
    ...newEvent,
    id,
  };

  const updatedEvents = [created, ...currentEvents];
  if (typeof window !== "undefined") {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: updatedEvents }));

    // Also update coordinator assignment counts for assigned members locally
    if (newEvent.assigned_coordinators && newEvent.assigned_coordinators.length > 0) {
      const updatedMembers = currentMembers.map((m) => {
        if (newEvent.assigned_coordinators.includes(m.name)) {
          return {
            ...m,
            events_coordinated_count: m.events_coordinated_count + 1,
          };
        }
        return m;
      });
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers));
      window.dispatchEvent(new CustomEvent("csi_members_updated", { detail: updatedMembers }));
    }
  }

  // Asynchronously save to Supabase
  if (supabase) {
    (async () => {
      try {
        // Try inserting full event payload
        const { error: insertErr } = await supabase.from("events").insert({
          id: created.id,
          event_name: created.event_name,
          event_date: created.event_date,
          time_start: created.time_start,
          time_end: created.time_end,
          mode: created.mode,
          venue: created.venue,
          target_branches: created.target_branches,
          faculty_in_charge: created.faculty_in_charge,
          brief_description: created.brief_description,
          status: created.status,
          required_coordinators: created.required_coordinators,
          assigned_coordinators: created.assigned_coordinators,
          google_form_url: created.google_form_url || null,
          google_sheet_url: created.google_sheet_url || null,
          is_registration_closed: created.is_registration_closed || false,
          registered_attendees: created.registered_attendees || [],
          feedback_google_form_url: created.feedback_google_form_url || null,
          feedback_google_sheet_url: created.feedback_google_sheet_url || null,
          is_feedback_closed: created.is_feedback_closed || false,
          feedback_attendees: created.feedback_attendees || [],
          winners: created.winners || {},
          certificate_templates: created.certificate_templates || {},
          certificate_writeups: created.certificate_writeups || {},
        });

        // Fallback: If migration script hasn't been run yet, insert baseline columns
        if (insertErr && insertErr.code === "42703") {
          await supabase.from("events").insert({
            id: created.id,
            event_name: created.event_name,
            event_date: created.event_date,
            status: created.status,
            required_coordinators: created.required_coordinators,
          });
        }

        // Also update member assignment counts in Supabase
        if (created.assigned_coordinators && created.assigned_coordinators.length > 0) {
          for (const coordName of created.assigned_coordinators) {
            const mem = currentMembers.find((m) => m.name === coordName);
            if (mem) {
              await supabase
                .from("members")
                .update({ events_coordinated_count: mem.events_coordinated_count + 1 })
                .eq("name", coordName);
            }
          }
        }
      } catch (err) {
        console.warn("Async Supabase event insert failed:", err);
      }
    })();
  }

  return created;
}

export function deleteEvent(id: string): boolean {
  if (typeof window === "undefined") return false;
  const currentEvents = getStoredEvents();
  const currentMembers = getStoredMembers();

  const toDelete = currentEvents.find((e) => e.id === id);
  if (!toDelete) return false;

  const filteredEvents = currentEvents.filter((e) => e.id !== id);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filteredEvents));
  window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: filteredEvents }));

  // Revert (-1) the coordinator assignment counts for coordinators of the deleted event
  if (toDelete.assigned_coordinators && toDelete.assigned_coordinators.length > 0) {
    const updatedMembers = currentMembers.map((m) => {
      if (toDelete.assigned_coordinators.includes(m.name)) {
        return {
          ...m,
          events_coordinated_count: Math.max(0, m.events_coordinated_count - 1),
        };
      }
      return m;
    });
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers));
    window.dispatchEvent(new CustomEvent("csi_members_updated", { detail: updatedMembers }));

    // Update in Supabase
    if (supabase) {
      (async () => {
        try {
          await supabase.from("events").delete().eq("id", id);
          for (const coordName of toDelete.assigned_coordinators) {
            const mem = currentMembers.find((m) => m.name === coordName);
            if (mem) {
              await supabase
                .from("members")
                .update({ events_coordinated_count: Math.max(0, mem.events_coordinated_count - 1) })
                .eq("name", coordName);
            }
          }
        } catch (err) {
          console.warn("Async Supabase event delete failed:", err);
        }
      })();
    }
  } else if (supabase) {
    supabase.from("events").delete().eq("id", id).then();
  }

  return true;
}

export function getEventById(id: string): CSIEvent | undefined {
  const allEvents = getStoredEvents();
  // Exact ID match
  let found = allEvents.find((e) => e.id === id);
  if (found) return found;

  // Fallback for initial numeric IDs (e1, e2, etc.) matching against data.ts index/name
  if (id.startsWith("e")) {
    const initialMatch = initialEvents.find((e) => e.id === id);
    if (initialMatch) {
      found = allEvents.find((e) => e.event_name === initialMatch.event_name);
      if (found) return found;
      return initialMatch;
    }
  }

  return undefined;
}

export function updateEvent(updatedEvent: CSIEvent): void {
  const currentEvents = getStoredEvents();
  const index = currentEvents.findIndex((e) => e.id === updatedEvent.id);
  if (index !== -1) {
    currentEvents[index] = updatedEvent;
  } else {
    currentEvents.push(updatedEvent);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(currentEvents));
    window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: currentEvents }));
  }

  // Asynchronously update Supabase
  if (supabase) {
    (async () => {
      try {
        const payload: Record<string, any> = {
          event_name: updatedEvent.event_name,
          event_date: updatedEvent.event_date,
          status: updatedEvent.status,
          required_coordinators: updatedEvent.required_coordinators,
        };

        if (updatedEvent.time_start) payload.time_start = updatedEvent.time_start;
        if (updatedEvent.time_end) payload.time_end = updatedEvent.time_end;
        if (updatedEvent.mode) payload.mode = updatedEvent.mode;
        if (updatedEvent.venue) payload.venue = updatedEvent.venue;
        if (updatedEvent.target_branches) payload.target_branches = updatedEvent.target_branches;
        if (updatedEvent.faculty_in_charge) payload.faculty_in_charge = updatedEvent.faculty_in_charge;
        if (updatedEvent.brief_description) payload.brief_description = updatedEvent.brief_description;
        if (updatedEvent.assigned_coordinators) payload.assigned_coordinators = updatedEvent.assigned_coordinators;
        if (updatedEvent.google_form_url !== undefined) payload.google_form_url = updatedEvent.google_form_url;
        if (updatedEvent.google_form_edit_url !== undefined) payload.google_form_edit_url = updatedEvent.google_form_edit_url;
        if (updatedEvent.google_form_id !== undefined) payload.google_form_id = updatedEvent.google_form_id;
        if (updatedEvent.google_sheet_url !== undefined) payload.google_sheet_url = updatedEvent.google_sheet_url;
        if (updatedEvent.google_sheet_id !== undefined) payload.google_sheet_id = updatedEvent.google_sheet_id;
        if (updatedEvent.is_registration_closed !== undefined) payload.is_registration_closed = updatedEvent.is_registration_closed;
        if (updatedEvent.registered_attendees !== undefined) payload.registered_attendees = updatedEvent.registered_attendees;
        if (updatedEvent.feedback_google_form_url !== undefined) payload.feedback_google_form_url = updatedEvent.feedback_google_form_url;
        if (updatedEvent.feedback_google_form_edit_url !== undefined) payload.feedback_google_form_edit_url = updatedEvent.feedback_google_form_edit_url;
        if (updatedEvent.feedback_google_form_id !== undefined) payload.feedback_google_form_id = updatedEvent.feedback_google_form_id;
        if (updatedEvent.feedback_google_sheet_url !== undefined) payload.feedback_google_sheet_url = updatedEvent.feedback_google_sheet_url;
        if (updatedEvent.feedback_google_sheet_id !== undefined) payload.feedback_google_sheet_id = updatedEvent.feedback_google_sheet_id;
        if (updatedEvent.is_feedback_closed !== undefined) payload.is_feedback_closed = updatedEvent.is_feedback_closed;
        if (updatedEvent.feedback_attendees !== undefined) payload.feedback_attendees = updatedEvent.feedback_attendees;
        if (updatedEvent.winners !== undefined) payload.winners = updatedEvent.winners;
        if (updatedEvent.certificate_templates !== undefined) payload.certificate_templates = updatedEvent.certificate_templates;
        if (updatedEvent.certificate_writeups !== undefined) payload.certificate_writeups = updatedEvent.certificate_writeups;
        if (updatedEvent.custom_feedback_questions !== undefined) payload.custom_feedback_questions = updatedEvent.custom_feedback_questions;

        const { error: upErr } = await supabase
          .from("events")
          .update(payload)
          .eq("id", updatedEvent.id);

        // Fallback: If rich columns fail due to migration not yet run, update baseline columns
        if (upErr && upErr.code === "42703") {
          await supabase.from("events").update({
            event_name: updatedEvent.event_name,
            event_date: updatedEvent.event_date,
            status: updatedEvent.status,
            required_coordinators: updatedEvent.required_coordinators,
          }).eq("id", updatedEvent.id);
        }
      } catch (err) {
        console.warn("Async Supabase event update failed:", err);
      }
    })();
  }
}

export const CERTIFICATE_BUCKET = "certificate-templates";

/**
 * Uploads a Certificate Template (.pptx, image, or pdf) to Supabase Storage Bucket,
 * organizing it neatly under the event's unique ID: `certificate-templates/{eventId}/{filename}`.
 * Returns the permanent public URL accessible to all coordinators and associates.
 */
export async function uploadCertificateTemplateToSupabase(
  file: File | Blob,
  eventId: string,
  type: "appreciation" | "participation",
  originalFilename?: string
): Promise<{ publicUrl: string; filename: string } | null> {
  if (!supabase) return null;

  try {
    const ext = originalFilename
      ? originalFilename.split(".").pop() || "pptx"
      : file instanceof File
      ? file.name.split(".").pop() || "pptx"
      : "pptx";

    const cleanFilename = `${type}_template_${Date.now()}.${ext}`;
    const filePath = `${eventId}/${cleanFilename}`;

    const { error: uploadErr } = await supabase.storage
      .from(CERTIFICATE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Storage upload warning:", uploadErr.message);
      // If bucket doesn't exist yet or permission denied, log helpful message
      if (uploadErr.message?.includes("Bucket not found")) {
        console.error("Please create a public bucket named 'certificate-templates' in Supabase Dashboard > Storage.");
      }
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(CERTIFICATE_BUCKET)
      .getPublicUrl(filePath);

    return {
      publicUrl: urlData.publicUrl,
      filename: originalFilename || (file instanceof File ? file.name : cleanFilename),
    };
  } catch (err) {
    console.warn("Upload certificate template to Supabase failed:", err);
    return null;
  }
}

/**
 * Uploads a generated batch certificates PDF or multi-slide PPTX to Supabase Storage Bucket,
 * e.g. `certificate-templates/{eventId}/winners_certificates.pdf`
 * Making it accessible immediately to any associate or device.
 */
export async function uploadGeneratedCertificatesToSupabase(
  fileBlob: Blob,
  eventId: string,
  type: "winners" | "participation",
  format: "pdf" | "pptx" = "pdf"
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const filename = `${type}_certificates.${format}`;
    const filePath = `${eventId}/${filename}`;
    const contentType =
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    const { error: uploadErr } = await supabase.storage
      .from(CERTIFICATE_BUCKET)
      .upload(filePath, fileBlob, {
        cacheControl: "3600",
        upsert: true,
        contentType: contentType,
      });

    if (uploadErr) {
      console.warn("Supabase Storage certificate upload warning:", uploadErr.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(CERTIFICATE_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn("Upload generated certificates to Supabase failed:", err);
    return null;
  }
}

/**
 * Resets the demo sandbox to initial default sample events and members.
 * Clears visitor modifications and restores fresh demo data.
 */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEvents));
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(initialMembers));
  window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: initialEvents }));
  window.dispatchEvent(new CustomEvent("csi_members_updated", { detail: initialMembers }));
}

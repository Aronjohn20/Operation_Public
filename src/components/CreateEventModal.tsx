"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, UserCheck, Calendar, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Member, BRANCHES } from "@/lib/types";
import { getStoredMembers, saveNewEvent } from "@/lib/eventsStorage";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (newEventId: string) => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const router = useRouter();
  const members: Member[] = getStoredMembers();

  // Wizard Step: 1 = Event Details, 2 = Coordinator Allocation
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [timeStart, setTimeStart] = useState("01:30 PM");
  const [timeEnd, setTimeEnd] = useState("04:30 PM");
  const [mode, setMode] = useState<"Offline" | "Online">("Offline");
  const [venue, setVenue] = useState("");
  const [targetBranches, setTargetBranches] = useState<string[]>([...BRANCHES]);
  const [briefDescription, setBriefDescription] = useState("");
  const [requiredCoordinators, setRequiredCoordinators] = useState(2);
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
  const [coordSearch, setCoordSearch] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  // Branch Selection
  const toggleBranch = (branch: string) => {
    if (targetBranches.includes(branch)) {
      setTargetBranches(targetBranches.filter((b) => b !== branch));
    } else {
      setTargetBranches([...targetBranches, branch]);
    }
  };

  const selectAllBranches = () => {
    if (targetBranches.length === BRANCHES.length) {
      setTargetBranches([]);
    } else {
      setTargetBranches([...BRANCHES]);
    }
  };

  // Coordinator Selection
  const toggleCoordinator = (name: string) => {
    if (selectedCoordinators.includes(name)) {
      setSelectedCoordinators(selectedCoordinators.filter((c) => c !== name));
    } else {
      if (selectedCoordinators.length >= requiredCoordinators) {
        return;
      }
      setSelectedCoordinators([...selectedCoordinators, name]);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(coordSearch.toLowerCase()) ||
    m.domain.toLowerCase().includes(coordSearch.toLowerCase()) ||
    m.class_batch.toLowerCase().includes(coordSearch.toLowerCase())
  );
  const sortedMembers = [...filteredMembers].sort((a, b) => a.events_coordinated_count - b.events_coordinated_count);

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !venue.trim()) {
      alert("Please enter Event Name, Date, and Venue before proceeding.");
      return;
    }
    if (!mode) {
      alert("Please select Event Mode (Offline or Online).");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = () => {
    const created = saveNewEvent({
      event_name: eventName,
      event_date: eventDate,
      time_start: timeStart,
      time_end: timeEnd,
      mode,
      venue,
      target_branches: targetBranches.length > 0 ? targetBranches : [...BRANCHES],
      faculty_in_charge: "Faculty Coordinator",
      brief_description: briefDescription,
      status: "confirmed",
      required_coordinators: requiredCoordinators,
      assigned_coordinators: selectedCoordinators,
    });

    handleClose();
    if (onEventCreated) {
      onEventCreated(created.id);
    }
    router.push(`/events/${created.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#12101C] border border-purple-500/40 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col text-white">
        {/* Header with Step Indicator */}
        <div className="px-7 py-5 border-b border-purple-500/20 flex items-center justify-between bg-[#0B0912]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Create Event Container
                </h2>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-purple-900/60 text-purple-200 border border-purple-500/40">
                  Step {step} of 2: {step === 1 ? "Event Details" : "Coordinator Allocation"}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                {step === 1 ? "Configure core event parameters" : "Assign coordinators from the 23-member roster"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEP 1: EVENT DETAILS ONLY */}
        {step === 1 && (
          <form onSubmit={goToStep2} className="p-7 overflow-y-auto space-y-6 flex-1 bg-[#12101C]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[18px] font-bold text-white mb-2">
                  Event Name <span className="text-red-400 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Web & AI Hackathon"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition placeholder:text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[18px] font-bold text-white mb-2">
                  Event Date <span className="text-red-400 font-extrabold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Mode is Required */}
              <div>
                <label className="block text-[18px] font-bold text-white mb-2">
                  Mode <span className="text-red-400 font-extrabold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-black p-1.5 rounded-xl border border-purple-500/50">
                  <button
                    type="button"
                    onClick={() => setMode("Offline")}
                    className={`py-2 text-[18px] font-bold rounded-lg transition ${
                      mode === "Offline"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Offline
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("Online")}
                    className={`py-2 text-[18px] font-bold rounded-lg transition ${
                      mode === "Online"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Online
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[18px] font-bold text-white mb-2">
                  Venue / Platform <span className="text-red-400 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={mode === "Offline" ? "e.g. Seminar Hall 1" : "e.g. Google Meet Link"}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 transition placeholder:text-slate-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[18px] font-bold text-white mb-2">Start Time</label>
                  <input
                    type="text"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[18px] font-bold text-white mb-2">End Time</label>
                  <input
                    type="text"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Target Audience: 9 Branches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[18px] font-bold text-white">
                  Eligible Branches
                </label>
                <button
                  type="button"
                  onClick={selectAllBranches}
                  className="text-sm text-purple-300 hover:text-white font-bold underline"
                >
                  {targetBranches.length === BRANCHES.length ? "Deselect All" : "Select All 9 Branches"}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {BRANCHES.map((branch) => {
                  const isSelected = targetBranches.includes(branch);
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => toggleBranch(branch)}
                      className={`py-2 px-2 rounded-xl border text-[18px] font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-purple-600/40 border-purple-400 text-white shadow-md shadow-purple-600/30"
                          : "bg-black border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
                      }`}
                    >
                      <span>{branch}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-200" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brief Description */}
            <div>
              <label className="block text-[18px] font-bold text-white mb-2">Brief Summary / Info</label>
              <textarea
                rows={3}
                placeholder="Give a concise summary of what participants will accomplish in this event..."
                value={briefDescription}
                onChange={(e) => setBriefDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-500 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Step 1 Actions */}
            <div className="pt-5 border-t border-purple-500/20 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[18px] font-bold text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[18px] font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                <span>Next: Allocate Coordinators</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: COORDINATOR ALLOCATION ONLY */}
        {step === 2 && (
          <div className="p-7 overflow-y-auto space-y-6 flex-1 bg-[#12101C]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-purple-400" />
                  Coordinator Allocation Roster
                </h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Assign coordinators from the 23-member roster. Light Workload tags indicate members with fewer past assignments.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto bg-black p-2.5 rounded-xl border border-purple-500/40">
                <span className="text-[18px] text-slate-300 font-bold">Required:</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={requiredCoordinators}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setRequiredCoordinators(val);
                    if (selectedCoordinators.length > val) {
                      setSelectedCoordinators(selectedCoordinators.slice(0, val));
                    }
                  }}
                  className="w-14 px-2 py-1 rounded-lg bg-[#181622] border border-purple-500/50 text-[18px] text-white text-center font-bold focus:outline-none"
                />
                <span
                  className={`text-[18px] px-3.5 py-1 rounded-xl font-bold ${
                    selectedCoordinators.length === requiredCoordinators
                      ? "bg-green-500/20 text-green-300 border border-green-500/50"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  }`}
                >
                  {selectedCoordinators.length} of {requiredCoordinators} Selected
                </span>
              </div>
            </div>

            {/* Coordinator Search */}
            <input
              type="text"
              placeholder="Search coordinator by name, domain, or class..."
              value={coordSearch}
              onChange={(e) => setCoordSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black border border-purple-500/50 text-[18px] text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-500 font-medium"
            />

            {/* 23 Member Grid with 18px fonts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-72 overflow-y-auto p-2 border border-purple-500/30 rounded-xl bg-black/60">
              {sortedMembers.map((member) => {
                const isSelected = selectedCoordinators.includes(member.name);
                const isFairChoice = member.events_coordinated_count <= 1;

                return (
                  <div
                    key={member.id}
                    onClick={() => toggleCoordinator(member.name)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? "bg-purple-900/40 border-purple-400 text-white shadow-lg shadow-purple-600/30"
                        : "bg-[#181622] border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white"
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[18px] font-bold text-white">{member.name}</span>
                        {isFairChoice && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-bold border border-emerald-500/40">
                            Light Workload
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{member.role} • {member.class_batch}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-purple-300 font-bold px-2 py-0.5 bg-purple-950 rounded">
                          {member.domain}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {member.events_coordinated_count} past event(s)
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "border-slate-600 text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-5 border-t border-purple-500/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[18px] font-bold text-slate-200 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Event Details</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[18px] font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Create Event &amp; Open Container</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Sparkles, Send, FileText, Star } from "lucide-react";
import { CSIEvent, RegisteredAttendee, FeedbackAttendee } from "@/lib/types";

interface SimulatedFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CSIEvent;
  mode: "registration" | "feedback";
  onRegisteredSuccess?: (newAttendee: RegisteredAttendee) => void;
  onFeedbackSuccess?: (newFeedback: FeedbackAttendee) => void;
}

const SAMPLE_STUDENTS = [
  { name: "Rahul S", email: "rahul.s@example.com", roll: "U230130", gender: "Mr", year: "3rd", branch: "CSE" },
  { name: "Ananya Krishna", email: "ananya.k@example.com", roll: "U230131", gender: "Ms", year: "2nd", branch: "CSBS" },
  { name: "Mathew Varghese", email: "mathew.v@example.com", roll: "U230132", gender: "Mr", year: "3rd", branch: "IT" },
  { name: "Sreya Nair", email: "sreya.n@example.com", roll: "U230133", gender: "Ms", year: "1st", branch: "AD" },
  { name: "Arjun Manoj", email: "arjun.m@example.com", roll: "U230134", gender: "Mr", year: "4th", branch: "CSE" },
];

export default function SimulatedFormModal({
  isOpen,
  onClose,
  event,
  mode,
  onRegisteredSuccess,
  onFeedbackSuccess,
}: SimulatedFormModalProps) {
  // Registration Form State
  const [title, setTitle] = useState<"Mr" | "Ms">("Mr");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regYear, setRegYear] = useState("3rd year");
  const [regBranch, setRegBranch] = useState(event.target_branches?.[0] || "CSE");
  const [isMember, setIsMember] = useState<"Yes" | "No">("Yes");

  // Feedback Form State
  const [fbName, setFbName] = useState("");
  const [fbUid, setFbUid] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbGender, setFbGender] = useState<"Mr" | "Ms">("Mr");
  const [fbBranch, setFbBranch] = useState(event.target_branches?.[0] || "CSE");
  const [fbYear, setFbYear] = useState("3rd");
  const [po10, setPo10] = useState("5");
  const [po11, setPo11] = useState("5");
  const [comments, setComments] = useState("");

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleAutoFill = () => {
    const picked = SAMPLE_STUDENTS[Math.floor(Math.random() * SAMPLE_STUDENTS.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    if (mode === "registration") {
      setTitle(picked.gender as "Mr" | "Ms");
      setRegName(`${picked.name} (Sample)`);
      setRegEmail(picked.email);
      setRegPhone(`9847${randomDigits}`);
      setRegYear(`${picked.year} year`);
      setRegBranch(event.target_branches?.includes(picked.branch) ? picked.branch : event.target_branches?.[0] || "CSE");
      setIsMember("Yes");
    } else {
      setFbGender(picked.gender as "Mr" | "Ms");
      setFbName(`${picked.name} (Verified)`);
      setFbUid(`U230${randomDigits.toString().slice(0, 3)}`);
      setFbEmail(picked.email);
      setFbBranch(event.target_branches?.includes(picked.branch) ? picked.branch : event.target_branches?.[0] || "CSE");
      setFbYear(picked.year);
      setPo10("5");
      setPo11("5");
      setComments("Excellent hands-on session! Very well coordinated and highly impactful.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "registration") {
      const finalName = regName.trim() || "Sample Student";
      const newAtt: RegisteredAttendee = {
        sl_no: (event.registered_attendees?.length || 0) + 1,
        name: finalName,
        roll_no: `U230${Math.floor(100 + Math.random() * 900)}`,
        class_batch: `S${regYear.startsWith("1") ? "1" : regYear.startsWith("2") ? "3" : regYear.startsWith("3") ? "5" : "7"} ${regBranch}`,
        gender: title === "Mr" ? "Male" : "Female",
      };

      if (onRegisteredSuccess) {
        onRegisteredSuccess(newAtt);
      }
    } else {
      const finalName = fbName.trim() || "Sample Participant";
      const newFb: FeedbackAttendee = {
        uid: fbUid.trim() || `U230${Math.floor(100 + Math.random() * 900)}`,
        name: finalName,
        email: fbEmail.trim() || "student@example.com",
        gender: fbGender,
        year_of_study: fbYear,
        branch: fbBranch,
        section: "Alpha",
        whatsapp: "9847000000",
        ratings: {
          "Overall Event Quality (PO10)": po10,
          "Relevance & Execution (PO11)": po11,
        },
        comments: comments.trim() || "Great initiative!",
      };

      if (onFeedbackSuccess) {
        onFeedbackSuccess(newFb);
      }
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0f0b1e] border-2 border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Google Forms Styled Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-purple-300" />
            <span>Interactive Form Simulation (100% Local Device)</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {event.event_name} – {mode === "registration" ? "Registration Form" : "Feedback & Certificate Verification"}
          </h2>
          <p className="text-purple-200/90 text-sm mt-1">
            {mode === "registration"
              ? "Simulates the Google Form submission workflow. Submitting adds this test attendee directly into your event's live attendance roster!"
              : "Simulates the post-event feedback submission. Submitting directly populates this verified participant into the Certificate Studio pipeline!"}
          </p>
        </div>

        {/* Content / Form Body */}
        {submitted ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Your response has been recorded!</h3>
            <p className="text-sm text-slate-300">
              {mode === "registration"
                ? "Test student added to the Attendance Sheet."
                : "Participant synced to Certificate Studio roster."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Quick Auto-Fill Bar */}
            <div className="flex items-center justify-between bg-purple-950/40 border border-purple-500/30 rounded-xl px-4 py-2.5">
              <span className="text-xs text-purple-200 font-medium">Want to test quickly without typing?</span>
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Fill Sample</span>
              </button>
            </div>

            {mode === "registration" ? (
              <>
                {/* Title */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-sm font-semibold text-white">1. Title *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="title"
                        checked={title === "Mr"}
                        onChange={() => setTitle("Mr")}
                        className="accent-purple-500"
                      />
                      <span>Mr</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="title"
                        checked={title === "Ms"}
                        onChange={() => setTitle("Ms")}
                        className="accent-purple-500"
                      />
                      <span>Ms</span>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-sm font-semibold text-white">2. Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* College Email ID */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-sm font-semibold text-white">3. College Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* WhatsApp */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-sm font-semibold text-white">4. WhatsApp Contact No. *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9847XXXXXX"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Year & Branch Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <label className="block text-sm font-semibold text-white">5. Year of Study *</label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                    >
                      <option value="1st year">1st year</option>
                      <option value="2nd year">2nd year</option>
                      <option value="3rd year">3rd year</option>
                      <option value="4th year">4th year</option>
                    </select>
                  </div>

                  <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <label className="block text-sm font-semibold text-white">6. Department *</label>
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                    >
                      {(event.target_branches && event.target_branches.length > 0
                        ? event.target_branches
                        : ["CSE", "CSBS", "IT", "AD"]
                      ).map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Membership */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-sm font-semibold text-white">7. Active Society Member? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="member"
                        checked={isMember === "Yes"}
                        onChange={() => setIsMember("Yes")}
                        className="accent-purple-500"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="member"
                        checked={isMember === "No"}
                        onChange={() => setIsMember("No")}
                        className="accent-purple-500"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Feedback Name */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-sm font-semibold text-white">1. Name (For Certificate) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name as it will appear on Certificate"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* UID and Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <label className="block text-sm font-semibold text-white">2. Roll / UID No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. U230105"
                      value={fbUid}
                      onChange={(e) => setFbUid(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                    <label className="block text-sm font-semibold text-white">3. College Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={fbEmail}
                      onChange={(e) => setFbEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ratings */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-sm font-semibold text-white">4. Rate Overall Event Quality (PO10) *</label>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4", "5"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPo10(val)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition flex items-center justify-center gap-1 ${
                          po10 === val
                            ? "bg-purple-600 text-white border-purple-400"
                            : "bg-black/40 text-slate-300 border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <Star className={`w-3 h-3 ${po10 === val ? "text-amber-300 fill-amber-300" : ""}`} />
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-sm font-semibold text-white">5. Rate Organization &amp; Relevance (PO11) *</label>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4", "5"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPo11(val)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition flex items-center justify-center gap-1 ${
                          po11 === val
                            ? "bg-purple-600 text-white border-purple-400"
                            : "bg-black/40 text-slate-300 border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <Star className={`w-3 h-3 ${po11 === val ? "text-amber-300 fill-amber-300" : ""}`} />
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="bg-[#18132b] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <label className="block text-sm font-semibold text-white">6. Feedback / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Your feedback and thoughts..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none resize-none"
                  />
                </div>
              </>
            )}

            {/* Submit Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Response</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


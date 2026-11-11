"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Trash2,
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Filter,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { CSIEvent, BRANCHES } from "@/lib/types";
import { getStoredEvents, deleteEvent } from "@/lib/eventsStorage";
import { formatOrdinalDate } from "@/lib/certificateExport";
import CreateEventModal from "@/components/CreateEventModal";

const statusStyles: Record<string, { text: string; class: string; icon: any }> = {
  planned: {
    text: "Planned",
    class: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    icon: Clock,
  },
  confirmed: {
    text: "Confirmed",
    class: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
    icon: CheckCircle2,
  },
  completed: {
    text: "Completed",
    class: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    icon: Trophy,
  },
};

export default function EventsArchivePage() {
  const [events, setEvents] = useState<CSIEvent[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reloadEvents = () => {
    setEvents(getStoredEvents());
  };

  useEffect(() => {
    reloadEvents();

    const handleEvents = (e: any) => {
      if (e.detail) setEvents(e.detail);
      else reloadEvents();
    };

    window.addEventListener("csi_events_updated", handleEvents);
    return () => {
      window.removeEventListener("csi_events_updated", handleEvents);
    };
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the event "${name}"?`)) {
      deleteEvent(id);
      reloadEvents();
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const completedEvents = events.filter((e) => e.status === "completed").length;
    const activeEvents = events.filter((e) => e.status !== "completed").length;

    const uniqueCoordinators = new Set<string>();
    let totalVerifiedAttendees = 0;

    events.forEach((e) => {
      e.assigned_coordinators?.forEach((c) => uniqueCoordinators.add(c));
      totalVerifiedAttendees += e.feedback_attendees?.length || e.registered_attendees?.length || 0;
    });

    return {
      totalEvents,
      completedEvents,
      activeEvents,
      coordinatorsMobilized: uniqueCoordinators.size,
      totalVerifiedAttendees,
    };
  }, [events]);

  // Multi-criteria Filtering
  const filtered = useMemo(() => {
    return events.filter((e) => {
      // Tab Status Filter
      if (activeTab === "active" && e.status === "completed") return false;
      if (activeTab === "completed" && e.status !== "completed") return false;

      // Mode Filter
      if (filterMode !== "all" && e.mode !== filterMode) return false;

      // Target Branch Filter
      if (filterBranch !== "all" && !e.target_branches?.includes(filterBranch)) return false;

      // Search (Matches title, venue, coordinator name, or description)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = e.event_name.toLowerCase().includes(query);
        const matchVenue = e.venue?.toLowerCase().includes(query);
        const matchDesc = e.brief_description?.toLowerCase().includes(query);
        const matchCoord = e.assigned_coordinators?.some((c) => c.toLowerCase().includes(query));
        if (!matchTitle && !matchVenue && !matchDesc && !matchCoord) return false;
      }

      return true;
    });
  }, [events, activeTab, filterMode, filterBranch, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
  }, [filtered]);

  // Featured Highlight Event: prioritizes active/upcoming event, or most recent completed
  const activeOrUpcomingEvent = useMemo(() => {
    const activeList = events.filter((e) => e.status !== "completed");
    if (activeList.length > 0) {
      return [...activeList].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )[0];
    }
    return events[0] || null;
  }, [events]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-csi-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Events Hosted Archive
          </h1>
          <p className="text-slate-300 text-[16px] mt-1.5 max-w-3xl">
            Comprehensive history and active operations container repository for all technical competitions, workshops, and flagship events hosted by Computer Society of India (CSI) Student Branch.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-5 py-3 rounded-xl text-[16px] transition shadow-lg shadow-purple-600/30 flex items-center gap-2 self-start md:self-auto shrink-0 border border-purple-400/30"
        >
          <Plus className="w-5 h-5" />
          <span>+ Create New Event</span>
        </button>
      </div>

      {/* KPI Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Events Hosted
            </span>
            <span className="text-2xl font-black text-white font-mono">{metrics.totalEvents}</span>
          </div>
        </div>

        <div className="bg-[#12101C] rounded-2xl border border-cyan-500/30 p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active / Upcoming
            </span>
            <span className="text-2xl font-black text-cyan-300 font-mono">{metrics.activeEvents}</span>
          </div>
        </div>

        <div className="bg-[#12101C] rounded-2xl border border-emerald-500/30 p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Completed Events
            </span>
            <span className="text-2xl font-black text-emerald-300 font-mono">{metrics.completedEvents}</span>
          </div>
        </div>
      </div>

      {/* FEATURED ACTIVE OR LATEST EVENT HIGHLIGHT CONTAINER */}
      {activeOrUpcomingEvent && (
        <div className="bg-gradient-to-r from-purple-950/40 via-[#181324] to-[#120F1C] rounded-2xl border border-purple-500/50 p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeOrUpcomingEvent.status !== "completed"
                    ? "bg-green-400 animate-ping"
                    : "bg-purple-400"
                }`}
              ></span>
              <span className="text-xs font-extrabold text-purple-200 uppercase tracking-widest bg-purple-950/90 border border-purple-500/50 px-3 py-1 rounded-full">
                {activeOrUpcomingEvent.status !== "completed"
                  ? "Current Spotlight • Active Event Container"
                  : "Latest Event Container"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/events/${activeOrUpcomingEvent.id}`}
                className="text-sm font-extrabold text-purple-300 hover:text-white flex items-center gap-1.5 transition underline"
              >
                <span>Open Full Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-white">{activeOrUpcomingEvent.event_name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                  {activeOrUpcomingEvent.mode}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  {activeOrUpcomingEvent.status}
                </span>
              </div>

              <div className="flex items-center gap-5 text-sm text-slate-200 flex-wrap font-medium">
                <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {formatOrdinalDate(activeOrUpcomingEvent.event_date)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {activeOrUpcomingEvent.venue}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {activeOrUpcomingEvent.assigned_coordinators.length} Coordinators Assigned
                </span>
              </div>

              {activeOrUpcomingEvent.brief_description && (
                <p className="text-sm text-slate-300 line-clamp-2">
                  {activeOrUpcomingEvent.brief_description}
                </p>
              )}
            </div>

            <div className="bg-black/80 rounded-xl border border-purple-500/40 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Assigned Coordinators
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {activeOrUpcomingEvent.assigned_coordinators.length > 0 ? (
                    activeOrUpcomingEvent.assigned_coordinators.map((name) => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-md bg-purple-900/40 border border-purple-500/40 text-xs text-purple-200 font-bold"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">None Assigned</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/events/${activeOrUpcomingEvent.id}`}
                  className="flex-1 py-2 text-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md"
                >
                  Manage Container
                </Link>
                <Link
                  href={`/events/${activeOrUpcomingEvent.id}/certificates`}
                  className="py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
                  title="Certificate Studio"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Certificates</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Status Tabs, Search, Filters, View Toggle */}
      <div className="space-y-4">
        {/* Archive Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-purple-500/30">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>All Events</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Active &amp; Planned</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                {metrics.activeEvents}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "completed"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Completed Archive</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                {metrics.completedEvents}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-purple-500/30 self-end sm:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs font-bold transition ${
                viewMode === "grid"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-xs font-bold transition ${
                viewMode === "table"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table Directory View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search archive by title, venue, coordinator name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black border border-purple-500/40 text-sm text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-black border border-purple-500/40 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
            >
              <option value="all">All Modes</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>

            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-black border border-purple-500/40 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
            >
              <option value="all">All Target Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  Dept: {b}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-300 font-mono font-semibold px-2 py-1 rounded bg-black/60 border border-purple-500/20">
              {sorted.length} events listed
            </span>
          </div>
        </div>
      </div>

      {/* ARCHIVE CONTENT: GRID OR TABLE */}
      {sorted.length === 0 ? (
        <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 p-12 text-center space-y-4 shadow-xl">
          <Trophy className="w-12 h-12 text-purple-400/40 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Archive Events Match Your Filters</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, status tab, or branch filter to browse other hosted events.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveTab("all");
              setFilterMode("all");
              setFilterBranch("all");
            }}
            className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition border border-purple-500/40"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((event) => {
            const statusInfo = statusStyles[event.status] || {
              text: event.status,
              class: "bg-slate-700 text-white",
              icon: Clock,
            };
            const StatusIcon = statusInfo.icon;
            const verifiedCount =
              event.feedback_attendees?.length || event.registered_attendees?.length || 0;

            return (
              <div
                key={event.id}
                className="bg-[#12101C] rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all p-5 shadow-xl flex flex-col justify-between space-y-4 group"
              >
                {/* Top Status & Mode Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${statusInfo.class}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.text}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-white/5 border border-white/10 text-slate-300">
                        {event.mode}
                      </span>
                      <button
                        onClick={() => handleDelete(event.id, event.event_name)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-lg font-bold text-white group-hover:text-purple-300 transition line-clamp-2"
                    >
                      {event.event_name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{formatOrdinalDate(event.event_date)}</span>
                    </div>
                  </div>

                  {/* Venue & Target Branches */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>

                    {event.target_branches && event.target_branches.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.target_branches.slice(0, 5).map((b) => (
                          <span
                            key={b}
                            className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/20 text-[10px] text-slate-400"
                          >
                            {b}
                          </span>
                        ))}
                        {event.target_branches.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-slate-500">
                            +{event.target_branches.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coordinators Chips */}
                  <div className="pt-2 border-t border-purple-500/20">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                      Coordinators ({event.assigned_coordinators?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {event.assigned_coordinators && event.assigned_coordinators.length > 0 ? (
                        event.assigned_coordinators.map((name) => (
                          <span
                            key={name}
                            className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 font-medium"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">None assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">{verifiedCount}</span> participants
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/events/${event.id}/certificates`}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                      title="Certificate Studio"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Studio</span>
                    </Link>

                    <Link
                      href={`/events/${event.id}`}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE DIRECTORY VIEW */
        <div className="bg-[#12101C] rounded-2xl border border-purple-500/30 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-500/30 flex items-center justify-between bg-[#0B0912]">
            <h2 className="text-base font-bold text-white">Event Archive Directory</h2>
            <span className="text-xs text-slate-400">
              Showing {sorted.length} events in archive
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-purple-500/30 text-slate-300 bg-csi-sidebar/70 text-xs font-bold">
                  <th className="py-3 px-5 text-white">EVENT NAME</th>
                  <th className="py-3 px-5 text-white">DATE &amp; VENUE</th>
                  <th className="py-3 px-5 text-white">STATUS</th>
                  <th className="py-3 px-5 text-white">COORDINATORS</th>
                  <th className="py-3 px-5 text-white text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20 text-sm">
                {sorted.map((event) => {
                  const statusInfo = statusStyles[event.status] || {
                    text: event.status,
                    class: "bg-slate-700 text-white",
                    icon: Clock,
                  };

                  return (
                    <tr key={event.id} className="hover:bg-purple-950/20 transition">
                      <td className="py-3.5 px-5 font-bold text-white">
                        <Link href={`/events/${event.id}`} className="hover:text-purple-300">
                          {event.event_name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px]">
                            {event.mode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 font-mono text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span>{formatOrdinalDate(event.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{event.venue}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {event.assigned_coordinators && event.assigned_coordinators.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {event.assigned_coordinators.map((name) => (
                              <span
                                key={name}
                                className="px-2 py-0.5 rounded bg-black border border-purple-500/30 text-xs text-purple-200 font-medium"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">None Assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/events/${event.id}/certificates`}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition"
                            title="Certificate Studio"
                          >
                            <Award className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/events/${event.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition shadow-sm"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id, event.event_name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reloadEvents();
        }}
        onEventCreated={() => {
          reloadEvents();
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Calendar, CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { CSIEvent, Member } from "@/lib/types";
import { getStoredEvents, getStoredMembers } from "@/lib/eventsStorage";

export default function Home() {
  const [events, setEvents] = useState<CSIEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    setEvents(getStoredEvents());
    setMembers(getStoredMembers());

    const handleEvents = (e: any) => {
      if (e.detail) setEvents(e.detail);
      else setEvents(getStoredEvents());
    };
    const handleMembers = (e: any) => {
      if (e.detail) setMembers(e.detail);
      else setMembers(getStoredMembers());
    };

    window.addEventListener("csi_events_updated", handleEvents);
    window.addEventListener("csi_members_updated", handleMembers);

    return () => {
      window.removeEventListener("csi_events_updated", handleEvents);
      window.removeEventListener("csi_members_updated", handleMembers);
    };
  }, []);

  const totalMembers = members.length;
  const activeEvents = events.filter((e) => e.status !== "completed").length;
  const completedEvents = events.filter((e) => e.status === "completed").length;
  const totalEvents = events.length;

  const newCoords = members.filter((m) => m.member_type === "new_coordinator").length;
  const oldCoords = members.filter((m) => m.member_type === "old_coordinator").length;

  const statCards = [
    {
      label: "ACTIVE COORDINATORS",
      value: totalMembers,
      sub: `${newCoords} New • ${oldCoords} Senior/Old`,
      borderColor: "border-t-green-500",
      icon: Users,
    },
    {
      label: "TOTAL EVENTS",
      value: totalEvents,
      sub: "Active term calendar",
      borderColor: "border-t-purple-500",
      icon: Calendar,
    },
    {
      label: "COMPLETED EVENTS",
      value: completedEvents,
      sub: `${activeEvents} upcoming / active`,
      borderColor: "border-t-cyan-500",
      icon: CheckCircle2,
    },
    {
      label: "PLATFORM STATUS",
      value: "Online",
      sub: "Club Chapter Active",
      borderColor: "border-t-pink-500",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-csi-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview Dashboard</h1>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-[#12101C] rounded-2xl border-2 border-purple-500/30 border-t-4 ${card.borderColor} p-6 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-4xl font-extrabold text-white mb-1.5">{card.value}</p>
              <p className="text-sm text-slate-300 font-medium">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-[#12101C] rounded-2xl border-2 border-purple-500/30 overflow-hidden shadow-xl">
        <div className="px-7 py-5 border-b-2 border-purple-500/30 flex items-center justify-between bg-[#0B0912]">
          <div>
            <h2 className="text-xl font-extrabold text-white">Recent Events Activity</h2>
            <p className="text-sm text-slate-400">Summary of latest events and assigned coordinators</p>
          </div>
          <Link
            href="/events"
            className="text-base text-purple-300 hover:text-white underline font-bold flex items-center gap-1.5"
          >
            <span>Go to Events Manager</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-purple-500/30 text-slate-300 bg-csi-sidebar/50 text-[20px] font-bold">
                <th className="py-4 px-6">EVENT NAME</th>
                <th className="py-4 px-6">DATE</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6">ASSIGNED COORDINATORS</th>
                <th className="py-4 px-6 text-right">VIEW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20 text-[18px]">
              {events.slice(0, 6).map((event) => {
                const statusMap: Record<string, { text: string; cls: string }> = {
                  planned: { text: "Planned", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/40" },
                  confirmed: { text: "Confirmed", cls: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" },
                  completed: { text: "Completed", cls: "bg-green-500/20 text-green-300 border border-green-500/40" },
                };
                const statusInfo = statusMap[event.status] || { text: event.status, cls: "bg-slate-700 text-white" };

                return (
                  <tr key={event.id} className="hover:bg-purple-950/20 transition">
                    <td className="py-4 px-6 font-bold text-white text-[18px]">
                      {event.event_name}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono text-[17px]">
                      {event.event_date}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm px-3.5 py-1 rounded-full font-bold ${statusInfo.cls}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-200">
                      {event.assigned_coordinators.length > 0 ? (
                        event.assigned_coordinators.join(", ")
                      ) : (
                        <span className="text-slate-500 italic text-base">None Assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-base text-purple-300 hover:text-white font-extrabold underline"
                      >
                        Container →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/events"
          className="group p-7 bg-[#12101C] rounded-2xl border-2 border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-600/20 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-purple-300 group-hover:translate-x-1 transition" />
          </div>
          <h2 className="text-2xl font-extrabold text-white group-hover:text-purple-300 transition">
            Events Hub &amp; Creation
          </h2>
          <p className="text-[19px] text-slate-300 mt-1.5 leading-relaxed">
            Create new events, allocate coordinators, and launch 4-in-1 auto-generation containers.
          </p>
        </Link>

        <Link
          href="/members"
          className="group p-7 bg-[#12101C] rounded-2xl border-2 border-purple-500/30 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4">
              <Users className="w-7 h-7" />
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition" />
          </div>
          <h2 className="text-2xl font-extrabold text-white group-hover:text-cyan-300 transition">
            Members Database &amp; Workload
          </h2>
          <p className="text-[19px] text-slate-300 mt-1.5 leading-relaxed">
            Manage members, track availability, and inspect coordination counts.
          </p>
        </Link>
      </div>
    </div>
  );
}

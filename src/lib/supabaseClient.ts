import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CSI Operations - Database Client (Neutralized for Public Demo)
// ============================================================================
// In Public Demo Sandbox mode, external Supabase connections are neutralized.
// All events, members, attendance rosters, and certificate templates run
// 100% locally inside each visitor's browser localStorage without touching
// any external cloud database.
// ============================================================================

export const supabase: SupabaseClient | null = null;

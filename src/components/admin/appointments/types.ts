import type { Tables, Enums } from "@/integrations/supabase/types";

export type Appointment = Tables<"appointments">;
export type DonationResult = Tables<"donation_results">;
export type Payment = Tables<"payments">;
export type FollowUp = Tables<"follow_ups">;

export type AppointmentStatus = Enums<"appointment_status">;
export type AppointmentPurpose = "research" | "clinical";
export type AppointmentLocation = "bethesda" | "germantown";
export type PaymentType = "screening" | "donation";
export type FollowUpStatus = "pending" | "attempted_1" | "attempted_2" | "completed" | "email_sent";

export interface AppointmentFormData {
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  purpose: AppointmentPurpose | "";
  location: AppointmentLocation | "";
  donor_letter: string;
  prescreened_by: string;
  prescreened_date: string;
  uber_needed: boolean;
  uber_ordered: boolean;
  notes: string;
}

export interface AppointmentWithDonor extends Appointment {
  donors?: {
    id: string;
    donor_id: string;
    first_name: string;
    last_name: string;
  };
  prescreener?: {
    full_name: string | null;
  };
}

export const APPOINTMENT_TYPES = [
  { value: "screening", label: "Screening" },
  { value: "donation", label: "Donation" },
] as const;

export const APPOINTMENT_PURPOSES = [
  { value: "research", label: "Research" },
  { value: "clinical", label: "Clinical" },
] as const;

export const APPOINTMENT_LOCATIONS = [
  { value: "bethesda", label: "Bethesda" },
  { value: "germantown", label: "Germantown" },
] as const;

export const DONOR_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00"
] as const;

export const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled", color: "secondary" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "outline" },
  { value: "no_show", label: "No Show", color: "destructive" },
  { value: "rescheduled", label: "Rescheduled", color: "warning" },
  { value: "deferred", label: "Deferred", color: "warning" },
  { value: "sample_not_taken", label: "Sample Not Taken", color: "outline" },
] as const;

export const CANCELLATION_REASONS = [
  { value: "donor_cancelled", label: "Donor Cancelled" },
  { value: "clinic_cancelled", label: "Clinic Cancelled" },
  { value: "donor_illness", label: "Donor Illness" },
  { value: "scheduling_conflict", label: "Scheduling Conflict" },
  { value: "transportation_issue", label: "Transportation Issue" },
  { value: "other", label: "Other" },
] as const;

export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "next7", label: "Next 7 Days" },
  { value: "month", label: "This Month" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
] as const;

export type CancellationReason = typeof CANCELLATION_REASONS[number]["value"];
export type DateRangeOption = typeof DATE_RANGE_OPTIONS[number]["value"];

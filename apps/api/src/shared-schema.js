// Mock schema for the API - temporary fix
import { z } from "zod";

export const insertJobPostingSchema = z.object({
  jobId: z.string(),
  title: z.string(),
  categoryId: z.number(),
  location: z.string(),
  employmentType: z.string(),
  experience: z.string(),
  summary: z.string(),
  description: z.string(),
  requirements: z.string(),
  isActive: z.boolean().default(true),
});

export const updateJobPostingSchema = insertJobPostingSchema.partial();

export const insertJobCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const updateJobCategorySchema = insertJobCategorySchema.partial();

export const insertJobApplicationSchema = z.object({
  userId: z.number(),
  jobId: z.number(),
  coverLetter: z.string().optional(),
  resumePath: z.string(),
});

export const APPLICATION_STATUSES = [
  'Pending', 'Under Review', 'Shortlisted',
  'Round 1 Scheduled', 'Reschedule Round 1', 'Round 1 Confirmed', 'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected',
  'Round 2 Scheduled', 'Reschedule Round 2', 'Round 2 Confirmed', 'Round 2 Completed', 'Round 2 Selected', 'Round 2 Not Selected',
  'Round 3 Scheduled', 'Reschedule Round 3', 'Round 3 Confirmed', 'Round 3 Completed', 'Round 3 Selected', 'Round 3 Not Selected',
  'Final Selected', 'Offer Extended', 'Onboarded',
  'Not Selected', 'Withdrawn by Candidate', 'Position Closed', 'Rejected - Candidate non responsive'
];

export const INTERVIEW_TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

export const DEFAULT_ROUND1_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
export const DEFAULT_ROUND2_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
export const DEFAULT_ROUND3_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
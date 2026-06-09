export interface JobPosting {
  id: number;
  jobId: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  employmentType: string;
  salaryRange?: string | null;
  isActive: boolean;
  postedAt?: string | null;
  closesAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CandidateUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified?: boolean;
}

export interface CandidateApplication {
  id: number;
  applicationNumber: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  jobId?: number;
  jobTitle?: string;
  jobDepartment?: string;
  jobLocation?: string;
  jobEmploymentType?: string;
  jobRef?: string;
  adminNotes?: string;
  resumeUrl?: string;
  interview?: {
    date: string;
    timeSlot: string;
    duration: number;
    interviewerName: string;
    location: string;
    meetingLink: string;
  } | null;
}

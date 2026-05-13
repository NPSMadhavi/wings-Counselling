
// =====================
// Application Status
// =====================
export const ApplicationStatus = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  SHORTLISTED: "shortlisted",
  NOT_SHORTLISTED: "not_shortlisted",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  HIRED: "hired",
  WITHDRAWN: "withdrawn",
};

// =====================
// Team Member Role
// =====================
export const Roles = {
  DIRECTOR: "director",
  COUNSELLOR: "counsellor",
  SUPPORT: "support",
};

// =====================
// Empty Objects (used in forms)
// =====================
export const EMPTY_JOB_APPLICATION = {
  id: 0,
  applicationNumber: "",
  jobId: null,
  candidateId: null,
  status: ApplicationStatus.SUBMITTED,
  resumeUrl: null,
  coverLetter: "",
  currentEmployer: "",
  yearsExperience: "",
  highestQualification: "",
  specialisations: [],
  linkedinUrl: "",
  noticePeriod: "",
  expectedSalary: "",
  adminNotes: "",
  submittedAt: null,
  updatedAt: null,
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  jobTitle: "",
  jobRef: "",
  department: "",
};

// =====================
// Interview Slot
// =====================
export const EMPTY_INTERVIEW_SLOT = {
  id: 0,
  applicationId: null,
  date: "",
  timeSlot: "",
  duration: 0,
  interviewerName: "",
  location: "",
  meetingLink: "",
  status: "",
  createdAt: null,
};

// =====================
// Interview Availability
// =====================
export const EMPTY_INTERVIEW_AVAILABILITY = {
  id: 0,
  date: "",
  timeSlot: "",
  duration: 0,
  interviewerName: "",
  location: "",
  meetingLink: "",
  notes: "",
  isBooked: false,
  bookedApplicationId: null,
  createdAt: null,
};

// =====================
// Team Member
// =====================
export const EMPTY_TEAM_MEMBER = {
  id: 0,
  name: "",
  title: "",
  role: Roles.COUNSELLOR,
  bio: "",
  credentials: [],
  specialisations: [],
  photoUrl: null,
  email: null,
  displayOrder: 0,
  isVisible: true,
  createdAt: null,
  updatedAt: null,
};

// =====================
// Article
// =====================
export const EMPTY_ARTICLE = {
  id: 0,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: null,
  author: "",
  category: "",
  isPublished: false,
  publishedAt: null,
};

// =====================
// Career
// =====================
export const EMPTY_CAREER = {
  id: 0,
  jobId: null,
  title: "",
  department: "",
  location: "",
  description: "",
  requirements: "",
  employmentType: "",
  salaryRange: "",
  isActive: true,
  postedAt: null,
  closesAt: null,
};

// =====================
// Event
// =====================
export const EMPTY_EVENT = {
  id: 0,
  title: "",
  description: "",
  photoUrls: [],
  eventDate: null,
  location: null,
  registrationUrl: null,
  showDonationButton: false,
  isPublished: false,
};
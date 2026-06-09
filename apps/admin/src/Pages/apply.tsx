import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, ArrowLeft, ChevronRight, Upload, Loader2, CheckCircle, User, AlertCircle, Share2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { careersApplyPath } from "@/lib/careers-routes";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JobPosting, JobCategory, UserProfile } from "@shared/schema";
import { Link } from "wouter";

export default function Apply() {
  const params = useParams<{ id: string }>();
  const slug = params.id || "";
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const applyFlowStage = sessionStorage.getItem("careerApplyStage") || "gate";
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setResumePath(response.objectPath);
      toast({ title: "Success", description: "Resume uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload resume", variant: "destructive" });
    }
  });

  const [coverLetter, setCoverLetter] = useState("");
  const [resumePath, setResumePath] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollToForm = () => {
    document.getElementById("application-form-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Legacy /apply/:id → /career/apply/:id
  useEffect(() => {
    if (location.startsWith("/apply/") && slug) {
      navigate(careersApplyPath(slug), { replace: true });
    }
  }, [location, slug, navigate]);

  const { data: job, isLoading: jobQueryLoading } = useQuery<JobPosting>({
    queryKey: [`/api/jobs/by-job-id/${slug}`],
    enabled: !!slug && !location.startsWith("/apply/"),
  });

  const numericJobId = job?.id;

  const { data: categories } = useQuery<JobCategory[]>({
    queryKey: ['/api/categories'],
  });

  const { data: applicationCheck } = useQuery<{ hasApplied: boolean }>({
    queryKey: [`/api/applications/check/${numericJobId}`],
    enabled: isAuthenticated && !!numericJobId,
  });

  const { data: profileData } = useQuery<{
    profile: UserProfile | null;
    certifications: any[];
    workExperience: any[];
  }>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const getCategoryName = (categoryId: number) => {
    return categories?.find(cat => cat.id === categoryId)?.name || 'General';
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;

    let completedFields = 0;
    let totalFields = 15;

    if (user.firstName) completedFields++;
    if (user.lastName) completedFields++;
    if (user.email) completedFields++;
    if (user.mobileNumber) completedFields++;
    if (user.emailVerified) completedFields++;

    const profile = profileData?.profile;
    if (profile) {
      if (profile.dateOfBirth) completedFields++;
      if (profile.gender) completedFields++;
      if (profile.address) completedFields++;
      if (profile.city) completedFields++;
      if (profile.country) completedFields++;
      if (profile.highestEducation) completedFields++;
      if (profile.currentJobTitle) completedFields++;
      if (profile.skills) completedFields++;
      if (profile.linkedinUrl) completedFields++;
      if (profile.resumePath) completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

// inside submitMutation

const submitMutation = useMutation({
  mutationFn: async (data: any) => {
    const res = await apiRequest('POST', '/api/applications', data);
    return res.json();
  },

  onSuccess: () => {
    toast({
      title: "Application Submitted!",
      description: "Thank you for applying."
    });

    sessionStorage.removeItem("careerApplyStage");
    sessionStorage.removeItem("returnTo");

    queryClient.invalidateQueries({
      queryKey: [`/api/applications/check/${numericJobId}`]
    });

    queryClient.invalidateQueries({
      queryKey: ["/api/candidate/applications"]
    });

    queryClient.invalidateQueries({
      queryKey: ['/api/profile']
    });

    setApplicationSubmitted(true);

    // redirect to careers page after submit
    setTimeout(() => {
      navigate("/career");
    }, 1500);
  },

  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to submit application",
      variant: "destructive"
    });
  }
});

  const loading = submitMutation.isPending || isUploading;
  const err = submitMutation.error instanceof Error ? submitMutation.error.message : "";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setResumeFile(file);
      await uploadFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!coverLetter.trim()) {
      toast({ title: "Error", description: "Please write a cover letter", variant: "destructive" });
      return;
    }
    if (!resumePath) {
      toast({ title: "Error", description: "Please upload your resume", variant: "destructive" });
      return;
    }

    submitMutation.mutate({
      jobId: numericJobId,
      coverLetter,
      resumePath,
    });
  };

  if (authLoading || (jobQueryLoading && !job)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || applyFlowStage !== "form") {
    return (
      <div className="min-h-screen bg-[#F7F6F3]">
        <Navbar />
        <section className="pt-32 pb-20 dark-gradient-bg">
        <main className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-[500px] min-h-[316px] bg-[#0D4A7A] rounded-[20px] shadow-[0_20px_50px_rgba(13,74,122,0.15)] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_rgba(13,74,122,0.25)] select-none px-6 sm:px-8 py-10 sm:py-12 flex flex-col items-center text-center gap-5">
            <div className="w-[50px] h-[50px] bg-white rounded-[10px] flex items-center justify-center shadow-sm shrink-0">
              <svg
                className="w-5 h-5 text-[#0D4A7A]"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-xl sm:text-[25px] font-semibold tracking-tight leading-tight font-['DM_Sans']">
              Sign In to Apply
            </h2>

            <p className="text-[15px] sm:text-[16px] text-white/90 font-normal leading-relaxed font-['DM_Sans'] max-w-[370px]">
              You need to create an account or sign in to apply for job positions at Wings
            </p>

            <button
              onClick={() => {
                sessionStorage.setItem("careerApplyStage", "form");
                sessionStorage.setItem("returnTo", location);
                navigate("/career/register");
              }}
              className="w-full sm:w-auto min-w-[200px] max-w-[244px] h-[46px] bg-white hover:bg-white/95 text-[#0D4A7A] text-[16px] font-medium rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.08)] font-['DM_Sans']"
            >
              Sign in / Create account
            </button>
          </div>
      </main>
        </section>
        <Footer />
      </div>
    );
  }


  if (!job) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <section className="pt-32 pb-20 dark-gradient-bg">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Job Not Found</h1>
            <Link href="/career">
              <Button className="bg-purple-600 hover:bg-purple-500">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Careers
              </Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (applicationCheck?.hasApplied && !applicationSubmitted) {
    return (
      <div className="min-h-screen bg-[#F7F6F3]">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto text-center bg-[#0D4A7A] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">Already Applied</h1>
              <p className="text-white mb-8 font-['DM_Sans']">
                You have already submitted an application for this position. We'll be in touch soon!
              </p>
              <Link href={`/career/${job?.jobId || slug}`}>
                <Button className="bg-white text-[#0D4A7A] font-['DM_Sans'] rounded-full px-8 py-6 h-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Job Details
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-[#F7F6F3]">
        <Navbar />
        <section className="pt-40 pb-20 dark-gradient-bg">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-[#0D4A7A] border-green-500/30 mb-8">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                  <h1 className="text-3xl font-bold text-white mb-4">Application Submitted Successfully!</h1>
                  <p className="text-white text-lg mb-2">
                    Thank you for applying for <span className="text-purple-400 font-semibold">{job.title}</span>
                  </p>
                  <p className="text-white">
                    Our team will review your application and get back to you soon.
                  </p>
                </CardContent>
              </Card>
{/* 
              <Card className="bg-gray-900/80 border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Complete Your Profile</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">Increase your chances of getting hired</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">Profile Completion</span>
                      <span className={`font-bold ${profileCompletion === 100 ? 'text-green-400' : profileCompletion >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {profileCompletion}%
                      </span>
                    </div>
                    <Progress
                      value={profileCompletion}
                      className="h-3 bg-gray-800"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/20">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-2">
                          Maximize Your Hiring Potential
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          Candidates with complete profiles are <span className="text-purple-400 font-semibold">3x more likely</span> to receive interview invitations.
                          A comprehensive profile helps our recruiters understand your qualifications better and enables faster processing of your application.
                        </p>
                        <p className="text-gray-400 mt-3 text-sm">
                          Please take a moment to complete your profile with accurate information including your work experience,
                          education details, certifications, and verify your mobile number for priority consideration.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!user?.phoneVerified && (
                    <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <p className="text-yellow-200 text-sm">
                        Your mobile number is not verified. Please verify it in your profile settings for enhanced credibility.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => navigate("/profile")}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                      data-testid="button-complete-profile"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Complete Your Profile Now
                    </Button>
                    <Link href="/career" className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                        data-testid="button-browse-jobs"
                      >
                        Browse More Opportunities
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card> */}
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* <section className="pt-32 pb-12 bg-[#F7F6F3] relative">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/career/${job?.jobId || slug}`}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-purple-500/20" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-purple-400">Apply for {job.title}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D4A7A] rounded-xl p-6 border border-purple-500/20 mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                {job.jobId}
              </Badge>
              <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                {getCategoryName(job.categoryId)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>{job.employmentType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{job.experience}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section> */}

      <div className="min-h-screen bg-[#F7F6F3] font-['DM_Sans']">
      {/* <Navbar /> */}
      {/* ═══ HERO SECTION ═══ */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden shrink-0"
        style={{
          background:
            'linear-gradient(rgba(58,58,58,0.8), rgba(0,0,0,0.8)), url("/assets/career1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6 md:px-12 lg:px-[150px] w-full max-w-[1440px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white font-['Outfit'] font-semibold mb-6 md:mb-8 text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] leading-[1.1]"
            style={{ maxWidth: "843px" }}
          >
            Build meaningful careers{" "}
            <span className="block">That create real impact</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/90 font-['DM_Sans'] font-normal text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed max-w-[750px] mb-8 md:mb-10"
          >
            Join WINGS and become part of a compassionate team dedicated to emotional wellness, counselling support, and community well-being
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-['DM_Sans'] font-semibold text-[16px] transition-all duration-300 shadow-lg cursor-pointer"
          >
            Explore open positions
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </motion.div>
      </section>

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="bg-[#F7F6F3] py-5">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px] flex items-center gap-2 text-[16px] font-['DM_Sans']">
          <Link href="/">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              Home
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <Link href="/careers">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              Career
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <Link href={`/career/${job.jobId}`}>
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              {job.title}
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <span className="text-gray-800">Application form</span>
        </div>
      </div>

      {/* ═══ JOB HEADER ═══ */}
      <section className="bg-[#0D4A7A] pt-8 pb-10 border-b-4 border-[#1E3A8A]">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px]">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold tracking-wide">
              {job.jobId}
            </span>
            {(job.department || getCategoryName(job.categoryId)) && (
              <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold tracking-wide">
                {job.department || getCategoryName(job.categoryId)}
              </span>
            )}
          </div>
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-semibold text-white font-['Outfit'] mb-5 leading-tight">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 mb-6 text-white/90 font-['DM_Sans'] font-medium text-[15px]">
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-[18px] h-[18px] text-white" />
                <span>{job.location}</span>
              </div>
            )}
            {job.experience && (
              <div className="flex items-center gap-2">
                <Clock className="w-[18px] h-[18px] text-white" />
                <span>{job.experience}</span>
              </div>
            )}
            {job.employmentType && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-[18px] h-[18px] text-white" />
                <span>{job.employmentType}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm cursor-pointer text-[15px] font-['DM_Sans']"
            >
              Apply now
              <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
            </button>
            <button className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm text-[15px] font-['DM_Sans']">
              Share <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ APPLICATION FORM ═══ */}
      <section id="application-form-section" className="py-10 md:py-14 bg-[#F7F6F3]">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-7 md:p-10 border border-gray-200"
          >
            <h2 className="text-[24px] md:text-[28px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-2">
              Application form
            </h2>
            <p className="text-gray-500 text-[14px] mb-8">
              Applying as <span className="font-semibold text-gray-700">{user?.email ?? ""}</span>
              {job.title ? (
                <>
                  {" "}
                  for <span className="font-semibold text-gray-700">{job.title}</span>
                </>
              ) : null}
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Cover Letter */}
              <div>
                <h3 className="text-[18px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-2">
                  Cover letter <span className="text-red-500">*</span>
                </h3>
                <p className="text-gray-500 text-[13px] mb-3">
                  Introduce yourself and explain why you are the ideal candidate for this position
                </p>
                <textarea
                  rows={16}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Type here"
                  className="w-full bg-[#E8EEF5] rounded-[10px] px-5 py-4 text-[14px] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0D4A7A]/30 transition-all resize-none border-none"
                />
              </div>

              {/* Resume / CV */}
              <div>
                <h3 className="text-[18px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-2">
                  Resume / CV <span className="text-red-500">*</span>
                </h3>
                <p className="text-gray-500 text-[13px] mb-3">
                  Upload your latest resume in PDF, DOC or DOCX format (Max 100MB)
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {resumeFile ? (
                  <div className="flex items-center gap-3 p-4 rounded-[10px] border border-green-200 bg-green-50">
                    <FileText size={20} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700 flex-1 truncate">
                      {resumeFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        setResumePath("");
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-green-500 hover:text-green-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#b3c7d6] rounded-[10px] py-6 text-center hover:border-[#0D4A7A] hover:bg-[#0D4A7A]/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Upload size={18} className="text-[#0D4A7A]" />
                      <p className="text-[14px] font-bold text-[#0D4A7A]">Click to upload resume</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Error */}
              {err && (
                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-red-50 border border-red-200">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-red-600 text-sm font-semibold">{err}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0D4A7A] hover:bg-[#0a3d66] text-white rounded-full font-bold transition-all duration-300 text-[14px] font-['DM_Sans'] cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Submit application"}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

    
    </div>

      <Footer />
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, AlertTriangle, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight, Brain, ShieldAlert, MonitorX,
  Trophy, BookOpen, Camera, CameraOff, Eye
} from "lucide-react";

const TOTAL_QUESTIONS = 30;
const MAX_WARNINGS = 5;
const TIMER_SECONDS = 45 * 60;

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical",
  reasoning: "Reasoning",
  aptitude: "Aptitude",
  real_world: "Real-World",
  role_specific: "Role-Specific",
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-600/80 text-blue-100",
  reasoning: "bg-purple-600/80 text-purple-100",
  aptitude: "bg-green-600/80 text-green-100",
  real_world: "bg-orange-600/80 text-orange-100",
  role_specific: "bg-pink-600/80 text-pink-100",
};

const CATEGORY_TIPS: Record<string, string> = {
  technical: "Consider revisiting core technical concepts and fundamentals for your domain.",
  reasoning: "Logical reasoning puzzles and pattern-recognition exercises can sharpen these skills.",
  aptitude: "Numerical and verbal aptitude practice tests are widely available online — a short daily session helps.",
  real_world: "Reading case studies and system-design guides can help bridge theory and application.",
  role_specific: "Hands-on projects and code reviews related to the role's core responsibilities strengthen role-specific knowledge.",
};

interface McqQuestion {
  id: number;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
  difficulty: string;
}

interface SessionInfo {
  id: number;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  warningCount: number;
  totalQuestions: number;
  passThreshold: number;
  score?: number;
  passed?: boolean;
}

type View = "loading" | "mobile" | "no-session" | "error" | "instructions" | "test" | "results" | "review";

type ReviewQuestion = {
  id: number;
  questionOrder: number;
  questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  category: string;
  difficulty: string;
  explanation: string | null;
  correctAnswer: string;
  candidateAnswer: string | null;
  isCorrect: boolean;
};

function TimerChip({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  let colorClass = "text-white bg-gray-800/80";
  let pulseClass = "";
  let prefix = "";

  if (seconds < 360) {
    colorClass = "text-red-300 bg-red-900/80 border border-red-500/50";
    pulseClass = "animate-pulse";
    prefix = "🔴 Final 5 mins — ";
  } else if (seconds < 960) {
    colorClass = "text-amber-300 bg-amber-900/70 border border-amber-500/50";
    pulseClass = "animate-pulse";
    prefix = "⚠ 15 min remaining — ";
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-lg ${colorClass} ${pulseClass}`}>
      <Clock className="w-4 h-4 shrink-0" />
      <span>{prefix}{label}</span>
    </div>
  );
}

function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Progress</span>
        <span>{answered} / {total} answered</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestionText({ text }: { text: string }) {
  // Split on fenced code blocks: ```lang\n...code...\n```
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const inner = part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="bg-gray-950 border border-gray-700/60 rounded-xl px-4 py-3 overflow-x-auto text-sm font-mono text-green-300 leading-relaxed whitespace-pre"
            >
              {inner.trim()}
            </pre>
          );
        }
        const trimmed = part.trim();
        if (!trimmed) return null;
        return (
          <p key={i} className="text-white text-[15px] font-medium leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function TechnicalEvaluation() {
  const params = useParams<{ jobId: string; candidateId: string }>();
  const appId = parseInt((params.candidateId ?? "0").split("-")[0], 10);
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("loading");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number; passed: boolean; totalQuestions: number; passThreshold: number; timedOut?: boolean;
  } | null>(null);

  const lastWarnRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitCalledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"pending" | "active" | "denied" | "unavailable">("pending");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [reviewCurrentQ, setReviewCurrentQ] = useState(0);
  const [loadingReview, setLoadingReview] = useState(false);

  // Face detection state
  const [faceStatus, setFaceStatus] = useState<"detecting" | "visible" | "not_visible" | "looking_away" | "multiple" | "unavailable">("detecting");
  const [multiScreenDetected, setMultiScreenDetected] = useState(false);
  const faceDetectorRef = useRef<any>(null);
  const noFaceCountRef = useRef(0);
  const gazeAwayCountRef = useRef(0);
  const lastFaceWarnRef = useRef(0);
  const lastGazeWarnRef = useRef(0);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  };

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/mcq/session/${appId}`, { credentials: "include" });
      if (res.status === 401) {
        sessionStorage.setItem("returnTo", `/technical-evaluation/${params.jobId}/${params.candidateId}`);
        navigate("/auth");
        return;
      }
      if (res.status === 403) { setView("error"); return; }
      const data = await res.json();
      if (!data.success) { setView("error"); return; }

      const sess: SessionInfo = data.session;
      if (!sess) { setView("no-session"); return; }

      setSessionInfo(sess);
      setWarningCount(sess.warningCount ?? 0);

      if (sess.status === "completed") {
        setResult({ score: sess.score ?? 0, passed: sess.passed ?? false, totalQuestions: sess.totalQuestions, passThreshold: sess.passThreshold ?? 28 });
        setView("results");
        return;
      }

      if (sess.status === "voided" || sess.status === "expired") {
        setView("error");
        return;
      }

      const qs: McqQuestion[] = data.questions ?? [];
      setQuestions(qs);

      if (sess.status === "in_progress") {
        if (sess.expiresAt) {
          const remaining = Math.max(0, Math.floor((new Date(sess.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
        setView("test");
        return;
      }

      setView("instructions");
    } catch {
      setView("error");
    }
  }, [appId, navigate, params.jobId, params.candidateId]);

  const handleOpenReview = async () => {
    setLoadingReview(true);
    try {
      const res = await fetch(`/api/mcq/session/${appId}/review`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReviewQuestions(data.reviewQuestions);
        setReviewCurrentQ(0);
        setView("review");
      } else {
        toast({ title: "Could not load review", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to load review.", variant: "destructive" });
    }
    setLoadingReview(false);
  };

  // If the URL has ?review=1, auto-jump into review mode once results load
  useEffect(() => {
    if (view !== "results" || !result || result.passed) return;
    if (!window.location.search.includes("review=1")) return;
    handleOpenReview();
  }, [view]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      sessionStorage.setItem("returnTo", `/technical-evaluation/${params.jobId}/${params.candidateId}`);
      navigate("/auth");
      return;
    }
    if (isMobile()) { setView("mobile"); return; }
    loadSession();
  }, [authLoading, isAuthenticated]);

  // Request camera permission on the INSTRUCTIONS screen so the browser dialog
  // appears before proctoring listeners are attached. This prevents the dialog
  // from triggering a blur/visibilitychange warning when the test starts.
  useEffect(() => {
    if (view !== "instructions") return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        cameraStreamRef.current = stream;
        setCameraStatus("active");
      } catch (err: unknown) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name ?? "";
        setCameraStatus(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied" : "unavailable");
      }
    })();
    // Don't stop the stream on cleanup — it carries forward into the test view
    return () => { cancelled = true; };
  }, [view]);

  // When the test starts, attach the already-acquired stream to the video element
  // (no second getUserMedia call needed — permission was already granted)
  useEffect(() => {
    if (view !== "test") return;
    if (cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
    return () => {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    };
  }, [view]);

  const sendWarning = useCallback(async (type: string, currentAnswers: Record<number, string>) => {
    const now = Date.now();
    if (now - lastWarnRef.current < 2000) return;
    lastWarnRef.current = now;

    const answerArr = Object.entries(currentAnswers).map(([qId, sel]) => ({
      questionId: parseInt(qId, 10),
      selectedAnswer: sel,
    }));

    try {
      const res = await fetch(`/api/mcq/session/${appId}/warning`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warningType: type, answers: answerArr }),
      });
      const data = await res.json();
      if (data.success) {
        const newCount = data.warningCount;
        setWarningCount(newCount);
        if (data.autoSubmit) {
          // Server already performed submission — use result from response directly.
          // Do NOT call /submit again; just transition to results.
          submitCalledRef.current = true;
          if (timerRef.current) clearInterval(timerRef.current);
          toast({ title: "Test auto-submitted", description: "Maximum violations reached or time expired.", variant: "destructive" });
          setResult({
            score: data.score ?? 0,
            passed: data.passed ?? false,
            totalQuestions: data.totalQuestions ?? TOTAL_QUESTIONS,
            passThreshold: sessionInfo?.passThreshold ?? 28,
            timedOut: !!data.timedOut,
          });
          setView("results");
        } else {
          const warningTitles: Record<string, string> = {
            tab_switch: "Tab switch detected",
            window_blur: "Window focus lost",
            face_not_visible: "Face not visible — stay in frame",
            gaze_away: "Looking away from screen",
            multiple_faces: "Multiple people detected",
            multiple_screens: "Multiple displays detected",
            secondary_screen: "Window on secondary screen",
          };
          const warnTitle = warningTitles[type] ?? "Proctoring violation";
          toast({
            title: `⚠ Warning ${newCount}/${MAX_WARNINGS}: ${warnTitle}`,
            description: `This violation has been logged. At ${MAX_WARNINGS} violations your test auto-submits.`,
            variant: "destructive",
          });
        }
      }
    } catch { /* silent — proctoring best-effort */ }
  }, [appId, toast]);

  // Multiple-screen detection — runs on instructions AND test views.
  // On instructions: only sets the flag to block the Start button (no warning sent).
  // On test: also fires a server warning if a new screen is detected after starting.
  useEffect(() => {
    if (view !== "instructions" && view !== "test") return;

    const check = async () => {
      // 1. Passive check: window position relative to primary screen width
      const sX = (window.screenX ?? (window as any).screenLeft ?? 0) as number;
      const screenW = window.screen.width;
      if (sX < -200 || sX > screenW + 200) {
        setMultiScreenDetected(true);
        if (view === "test") {
          setAnswers(prev => { sendWarning("secondary_screen", prev); return prev; });
        }
        return;
      }

      // 2. Screen Details API (Chrome 100+) — requests permission to enumerate screens
      if ("getScreenDetails" in window) {
        try {
          const details = await (window as any).getScreenDetails();
          if (details.screens && details.screens.length > 1) {
            setMultiScreenDetected(true);
            if (view === "test") {
              setAnswers(prev => { sendWarning("multiple_screens", prev); return prev; });
            }
          }
        } catch {
          // Permission denied or unavailable — silent
        }
      }
    };

    check();
  }, [view, sendWarning]);

  // Face detection via browser-native FaceDetector API (Chrome/Edge)
  useEffect(() => {
    if (view !== "test" || cameraStatus !== "active") return;

    // FaceDetector is experimental; gracefully skip if unavailable
    if (typeof (window as any).FaceDetector === "undefined") {
      setFaceStatus("unavailable");
      return;
    }

    let detector: any;
    try {
      detector = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 3 });
      faceDetectorRef.current = detector;
    } catch {
      setFaceStatus("unavailable");
      return;
    }

    setFaceStatus("detecting");

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!detector || !video || video.readyState < 2 || video.videoWidth === 0) return;

      try {
        const faces = await detector.detect(video);

        if (faces.length === 0) {
          // No face visible
          noFaceCountRef.current++;
          gazeAwayCountRef.current = 0;
          setFaceStatus("not_visible");

          // Log warning after 3 consecutive no-face detections (~6 s), max 1 per 30 s
          if (noFaceCountRef.current >= 3) {
            const now = Date.now();
            if (now - lastFaceWarnRef.current > 30000) {
              lastFaceWarnRef.current = now;
              noFaceCountRef.current = 0;
              setAnswers(prev => { sendWarning("face_not_visible", prev); return prev; });
            }
          }
        } else if (faces.length > 1) {
          // Multiple people in frame
          noFaceCountRef.current = 0;
          gazeAwayCountRef.current = 0;
          setFaceStatus("multiple");
          const now = Date.now();
          if (now - lastFaceWarnRef.current > 60000) {
            lastFaceWarnRef.current = now;
            setAnswers(prev => { sendWarning("multiple_faces", prev); return prev; });
          }
        } else {
          // Single face — check position relative to frame centre
          noFaceCountRef.current = 0;
          const face = faces[0];
          const videoW = video.videoWidth || 640;
          const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
          const normalized = faceCenterX / videoW; // 0 = far left, 0.5 = centre, 1 = far right

          if (normalized < 0.15 || normalized > 0.85) {
            // Face is consistently at the edge → likely looking away / second screen
            gazeAwayCountRef.current++;
            setFaceStatus("looking_away");

            // Warn after 5 consecutive edge detections (~10 s), max 1 per 30 s
            if (gazeAwayCountRef.current >= 5) {
              const now = Date.now();
              if (now - lastGazeWarnRef.current > 30000) {
                lastGazeWarnRef.current = now;
                gazeAwayCountRef.current = 0;
                setAnswers(prev => { sendWarning("gaze_away", prev); return prev; });
              }
            }
          } else {
            gazeAwayCountRef.current = 0;
            setFaceStatus("visible");
          }
        }
      } catch { /* detection errors are non-fatal */ }
    }, 2000);

    faceIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      faceDetectorRef.current = null;
    };
  }, [view, cameraStatus, sendWarning]);

  const doSubmit = useCallback(async (currentAnswers: Record<number, string>, autoSubmitted = false) => {
    if (submitCalledRef.current) return;
    submitCalledRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const answerArr = Object.entries(currentAnswers).map(([qId, sel]) => ({
      questionId: parseInt(qId, 10),
      selectedAnswer: sel,
    }));

    try {
      const res = await fetch(`/api/mcq/session/${appId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerArr, autoSubmitted }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ score: data.score, passed: data.passed, totalQuestions: data.totalQuestions, passThreshold: data.passThreshold ?? sessionInfo?.passThreshold ?? 28, timedOut: data.timedOut });
        setView("results");
      } else {
        toast({ title: "Submission error", description: data.message, variant: "destructive" });
        submitCalledRef.current = false;
      }
    } catch {
      toast({ title: "Network error", description: "Failed to submit test. Please try again.", variant: "destructive" });
      submitCalledRef.current = false;
    }
    setIsSubmitting(false);
  }, [appId, toast]);

  useEffect(() => {
    if (view !== "test") return;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["c", "v", "a", "u"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === "F12" || (mod && e.shiftKey && e.key === "I")) e.preventDefault();
      if (e.key === "PrintScreen") e.preventDefault();
    };
    const onVisibility = () => {
      if (document.hidden) {
        setAnswers(prev => { sendWarning("tab_switch", prev); return prev; });
      }
    };
    const onBlur = () => {
      setAnswers(prev => { sendWarning("window_blur", prev); return prev; });
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [view, sendWarning]);

  useEffect(() => {
    if (view !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setAnswers(current => {
            doSubmit(current, true);
            return current;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  const handleStartTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mcq/session/${appId}/start`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const sess = data.session;
        setSessionInfo(sess);
        if (sess.expiresAt) {
          const remaining = Math.max(0, Math.floor((new Date(sess.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(remaining);
        } else {
          setTimeLeft(TIMER_SECONDS);
        }
        setView("test");
      } else {
        toast({ title: "Could not start test", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to start the test. Please try again.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleAnswer = (questionId: number, letter: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: letter }));
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[currentQ];

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (view === "mobile") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <MonitorX className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Desktop Required</h1>
          <p className="text-gray-400">
            The Technical Evaluation must be completed on a desktop or laptop computer.
            Please open this link on a larger screen to proceed.
          </p>
        </div>
      </div>
    );
  }

  if (view === "no-session") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">No Test Available</h1>
          <p className="text-gray-400 mb-6">
            Your technical evaluation hasn't been set up yet. Please wait for the interviewer to prepare your test during the interview session.
          </p>
          <Button onClick={() => navigate("/profile")} className="bg-violet-700 hover:bg-violet-600 text-white border-0">
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Session Unavailable</h1>
          <p className="text-gray-400 mb-6">
            This test session is no longer active. It may have been voided or expired. Please contact your interviewer.
          </p>
          <Button onClick={() => navigate("/profile")} className="bg-violet-700 hover:bg-violet-600 text-white border-0">
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  if (view === "instructions") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-gray-900 border border-purple-500/30 rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-violet-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Technical Evaluation</h1>
            <p className="text-gray-400">Read the instructions carefully before you begin.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{TOTAL_QUESTIONS}</p>
              <p className="text-gray-400 text-sm">Questions</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">45 min</p>
              <p className="text-gray-400 text-sm">Time Limit</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{sessionInfo?.passThreshold ?? 28}/{TOTAL_QUESTIONS}</p>
              <p className="text-gray-400 text-sm">Pass Score</p>
            </div>
          </div>

          <div className="mb-8 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Topics Covered
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Technical", "Reasoning", "Aptitude", "Real-World Scenarios", "Role-Specific (Code Debugging / Test Cases)"].map(t => (
                <Badge key={t} className="bg-purple-900/50 text-purple-200 border border-purple-500/30">{t}</Badge>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Rules & Proctoring
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Allow camera access when prompted — your video feed is monitored throughout the test.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Keep your face clearly visible and centred in the camera frame at all times. Disappearing from frame or consistently looking away is flagged.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Only one person should be visible in the camera — multiple faces are flagged automatically.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Use a single screen — secondary or external monitors are detected and logged.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Do not switch tabs or windows — each focus loss is logged. At 5 total violations, your test auto-submits.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>Right-click, copy, paste, and select-all are disabled during the test.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>DevTools access is blocked.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>The timer runs on the server — closing your browser does not pause it.</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5 shrink-0">•</span>At 0:00, the test auto-submits with whatever you have answered.</li>
            </ul>
          </div>

          {/* Camera permission status — shown before test starts */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-sm border ${
            cameraStatus === "active"
              ? "bg-green-900/20 border-green-600/30 text-green-300"
              : cameraStatus === "denied"
              ? "bg-red-900/20 border-red-600/30 text-red-300"
              : cameraStatus === "unavailable"
              ? "bg-yellow-900/20 border-yellow-600/30 text-yellow-300"
              : "bg-gray-800/60 border-gray-700/40 text-gray-400"
          }`}>
            {cameraStatus === "active" && <><span className="text-green-400 text-base">●</span> Camera access granted — your feed will be monitored during the test.</>}
            {cameraStatus === "denied" && <><span className="text-red-400 text-base">●</span> Camera access denied. You can still take the test, but proctoring will be limited.</>}
            {cameraStatus === "unavailable" && <><span className="text-yellow-400 text-base">●</span> Camera not detected. You can still take the test, but proctoring will be limited.</>}
            {cameraStatus === "pending" && <><Loader2 className="w-4 h-4 animate-spin text-gray-400" /> Waiting for camera permission — please allow access in your browser when prompted.</>}
          </div>

          {/* Multiple-screen warning — blocks start until resolved */}
          {multiScreenDetected && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4 text-sm border bg-red-900/20 border-red-600/30 text-red-300">
              <span className="text-red-400 text-base shrink-0 mt-0.5">⛔</span>
              <span>
                <strong>Multiple screens detected.</strong> This evaluation must be taken on a single display. Please disconnect all secondary monitors or external displays, then refresh the page before starting.
              </span>
            </div>
          )}

          <Button
            onClick={handleStartTest}
            disabled={isSubmitting || cameraStatus === "pending" || multiScreenDetected}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold py-4 text-lg rounded-xl disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Starting…</> : cameraStatus === "pending" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Waiting for camera…</> : "Start Evaluation →"}
          </Button>

          <p className="text-center text-gray-500 text-xs mt-4">
            By clicking Start, you agree to abide by the evaluation rules above.
          </p>
        </motion.div>
      </div>
    );
  }

  if (view === "results" && result) {
    const passed = result.passed;
    const score = result.score ?? 0;
    const total = result.totalQuestions ?? TOTAL_QUESTIONS;
    const pct = total > 0 ? ((score / total) * 100).toFixed(1) : "0.0";

    const categoryBreakdown = questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.category] = (acc[q.category] ?? 0) + 1;
      return acc;
    }, {});
    const answeredByCategory = questions.reduce<Record<string, number>>((acc, q) => {
      if (answers[q.id]) acc[q.category] = (acc[q.category] ?? 0) + 1;
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-xl w-full rounded-2xl p-8 shadow-2xl border text-center ${
            passed
              ? "bg-green-950/80 border-green-500/40"
              : "bg-gray-900 border-gray-700/50"
          }`}
        >
          <div className="mb-6">
            {passed ? (
              <>
                <div className="relative inline-block mb-4">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-yellow-400/10"
                  />
                </div>
                <h1 className="text-3xl font-bold text-green-300 mb-2">Congratulations!</h1>
                <p className="text-green-200/80 text-lg mb-4">You've cleared Round 1 — Technical Evaluation!</p>
                <div className="inline-flex items-center gap-3 bg-green-900/60 border border-green-500/40 rounded-2xl px-6 py-4 mb-6">
                  <span className="text-4xl font-black text-white">{score}/{total}</span>
                  <span className="text-green-300 text-xl font-bold">({pct}%)</span>
                </div>
                <p className="text-green-200/70 text-sm">
                  You will receive an email shortly with instructions to schedule your Round 2 interview.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Thank You for Trying</h1>
                <p className="text-gray-400 mb-4">Here's how you did on this attempt:</p>
                <div className="inline-flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-2xl px-6 py-4 mb-6">
                  <span className="text-4xl font-black text-white">{score}/{total}</span>
                  <span className="text-gray-400 text-xl font-bold">({pct}%)</span>
                  <Badge className="bg-red-600 text-white ml-2 text-sm">Need {result.passThreshold} to pass</Badge>
                </div>

                {questions.length > 0 && (
                  <div className="text-left mb-6">
                    <p className="text-gray-300 font-semibold mb-3 text-sm">Areas to focus on:</p>
                    <div className="space-y-2">
                      {Object.entries(categoryBreakdown).map(([cat, count]) => {
                        const answered = answeredByCategory[cat] ?? 0;
                        const coverage = count > 0 ? Math.round((answered / count) * 100) : 0;
                        const isWeak = coverage < 70;
                        return (
                          <div key={cat} className={`flex items-start gap-3 p-3 rounded-lg border ${isWeak ? 'bg-red-950/30 border-red-800/40' : 'bg-gray-800/40 border-gray-700/40'}`}>
                            <div className={`text-xs font-medium px-2 py-0.5 rounded mt-0.5 shrink-0 ${CATEGORY_COLORS[cat] ?? 'bg-gray-600 text-gray-100'}`}>
                              {CATEGORY_LABELS[cat] ?? cat}
                            </div>
                            <p className="text-gray-300 text-xs">{CATEGORY_TIPS[cat] ?? "Keep practising!"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-gray-400 text-sm">
                  Better luck next time! You're welcome to reapply after 6 months. Keep building and growing — every attempt teaches something new.
                </p>
              </>
            )}
          </div>

          {!passed && (
            <Button
              onClick={handleOpenReview}
              disabled={loadingReview}
              className="w-full mt-2 border-0 bg-violet-800/60 hover:bg-violet-700/60 text-violet-100 font-semibold"
            >
              {loadingReview ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Review…</> : "📋 Review My Answers & Explanations"}
            </Button>
          )}
          <Button
            onClick={() => navigate("/profile")}
            className={`w-full mt-2 border-0 ${passed ? "bg-green-800/60 hover:bg-green-700/60 text-green-100" : "bg-gray-700/60 hover:bg-gray-600/60 text-gray-200"}`}
          >
            Back to Profile
          </Button>
        </motion.div>
      </div>
    );
  }

  if (view === "review" && reviewQuestions.length > 0) {
    const rq = reviewQuestions[reviewCurrentQ];
    const reviewOptions: Array<{ letter: "A" | "B" | "C" | "D"; text: string }> = [
      { letter: "A", text: rq.optionA },
      { letter: "B", text: rq.optionB },
      { letter: "C", text: rq.optionC },
      { letter: "D", text: rq.optionD },
    ];
    const correctCount = reviewQuestions.filter(q => q.isCorrect).length;
    const skippedCount = reviewQuestions.filter(q => !q.candidateAnswer).length;
    const wrongCount = reviewQuestions.length - correctCount - skippedCount;

    return (
      <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 bg-gray-900/80 border-b border-gray-800 px-6 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-white font-semibold text-sm tracking-wide">Test Review</span>
            <Badge className="bg-violet-900/60 text-violet-300 border border-violet-500/30 text-xs ml-1">Read Only</Badge>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" /> {correctCount} correct</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-700 inline-block" /> {wrongCount} wrong</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-600 inline-block" /> {skippedCount} skipped</span>
          </div>
        </div>

        {/* 3-column body */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT — Legend */}
          <aside className="w-56 shrink-0 bg-gray-900/60 border-r border-gray-800 flex flex-col p-4 gap-4 overflow-y-auto">
            <div>
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Legend</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-emerald-700 ring-2 ring-emerald-400 shrink-0" />
                  <span className="text-gray-300 text-xs">Correct answer</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-red-800 ring-2 ring-red-500 shrink-0" />
                  <span className="text-gray-300 text-xs">Your wrong answer</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-emerald-900/50 ring-2 ring-emerald-600/60 ring-dashed shrink-0" />
                  <span className="text-gray-300 text-xs">Correct (you skipped)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-gray-700 shrink-0" />
                  <span className="text-gray-400 text-xs">Not selected</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-3">
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">Question Map</p>
              <div className="flex flex-wrap gap-1">
                {reviewQuestions.map((rqq, idx) => (
                  <button
                    key={rqq.id}
                    onClick={() => setReviewCurrentQ(idx)}
                    className={`w-7 h-7 text-[11px] rounded font-semibold transition-all shrink-0 ${
                      idx === reviewCurrentQ
                        ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900"
                        : rqq.isCorrect
                        ? "bg-emerald-700/90 text-emerald-100"
                        : rqq.candidateAnswer
                        ? "bg-red-800/80 text-red-100"
                        : "bg-gray-700/80 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — Question review */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Question number strip */}
            <div className="shrink-0 bg-gray-900/40 border-b border-gray-800 px-4 py-2.5 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {reviewQuestions.map((rqq, idx) => (
                  <button
                    key={rqq.id}
                    onClick={() => setReviewCurrentQ(idx)}
                    className={`w-7 h-7 text-[11px] rounded font-semibold transition-all shrink-0 ${
                      idx === reviewCurrentQ
                        ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900"
                        : rqq.isCorrect
                        ? "bg-emerald-700/90 text-emerald-100 hover:bg-emerald-600"
                        : rqq.candidateAnswer
                        ? "bg-red-800/80 text-red-100 hover:bg-red-700"
                        : "bg-gray-700/80 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Question content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewCurrentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Category + difficulty + result badge */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge className={`text-xs ${CATEGORY_COLORS[rq.category] ?? "bg-gray-600 text-gray-100"}`}>
                      {CATEGORY_LABELS[rq.category] ?? rq.category}
                    </Badge>
                    <Badge className="bg-gray-700/80 text-gray-300 text-xs">{rq.difficulty}</Badge>
                    {rq.isCorrect
                      ? <Badge className="bg-emerald-700/70 text-emerald-200 text-xs">✓ Correct</Badge>
                      : rq.candidateAnswer
                      ? <Badge className="bg-red-800/70 text-red-200 text-xs">✗ Incorrect</Badge>
                      : <Badge className="bg-gray-600/70 text-gray-300 text-xs">— Skipped</Badge>
                    }
                    <span className="text-gray-500 text-xs ml-auto">Q{reviewCurrentQ + 1} / {reviewQuestions.length}</span>
                  </div>

                  {/* Question text */}
                  <div className="mb-5">
                    <QuestionText text={rq.questionText} />
                  </div>

                  {/* Options — colour-coded */}
                  <div className="space-y-2.5 mb-6">
                    {reviewOptions.map(({ letter, text }) => {
                      const isCorrect = letter === rq.correctAnswer;
                      const isChosen = letter === rq.candidateAnswer;
                      const wasSkipped = !rq.candidateAnswer;

                      let cls = "border-gray-700/60 bg-gray-800/40 text-gray-300";
                      if (isCorrect && isChosen) cls = "border-emerald-500 bg-emerald-900/40 text-emerald-100";
                      else if (isChosen && !isCorrect) cls = "border-red-500 bg-red-900/40 text-red-100";
                      else if (isCorrect && !isChosen) cls = wasSkipped
                        ? "border-emerald-600/60 border-dashed bg-emerald-950/30 text-emerald-300"
                        : "border-emerald-600/60 border-dashed bg-emerald-950/30 text-emerald-300";

                      return (
                        <div key={letter} className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${cls}`}>
                          <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                            isCorrect && isChosen ? "bg-emerald-600 border-emerald-400 text-white"
                            : isChosen && !isCorrect ? "bg-red-700 border-red-500 text-white"
                            : isCorrect ? "bg-emerald-900/60 border-emerald-600 text-emerald-300"
                            : "bg-gray-700 border-gray-600 text-gray-400"
                          }`}>{letter}</span>
                          <span className="text-sm leading-relaxed pt-0.5">{text}</span>
                          {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 ml-auto" />}
                          {isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation block */}
                  {rq.explanation && (
                    <div className="bg-blue-950/30 border border-blue-700/40 rounded-xl px-5 py-4">
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Explanation
                      </p>
                      <p className="text-blue-100/90 text-sm leading-relaxed">{rq.explanation}</p>
                    </div>
                  )}
                  {!rq.explanation && (
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl px-5 py-4">
                      <p className="text-gray-500 text-sm">No explanation available for this question.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / Next */}
            <div className="shrink-0 bg-gray-900/60 border-t border-gray-800 px-6 py-3 flex items-center justify-between gap-3">
              <Button
                onClick={() => setReviewCurrentQ(v => Math.max(0, v - 1))}
                disabled={reviewCurrentQ === 0}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 border-0 px-5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-gray-500 text-xs font-mono">Q{reviewCurrentQ + 1} of {reviewQuestions.length}</span>
              <Button
                onClick={() => setReviewCurrentQ(v => Math.min(reviewQuestions.length - 1, v + 1))}
                disabled={reviewCurrentQ >= reviewQuestions.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 border-0 px-5"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </main>

          {/* RIGHT — Score summary */}
          <aside className="w-52 shrink-0 bg-gray-900/60 border-l border-gray-800 flex flex-col p-3 gap-3">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest">Your Result</p>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-3xl font-black text-white">{result?.score ?? correctCount}<span className="text-gray-500 text-lg">/{reviewQuestions.length}</span></p>
              <p className="text-gray-400 text-xs mt-1">{reviewQuestions.length > 0 ? ((correctCount / reviewQuestions.length) * 100).toFixed(1) : "0.0"}%</p>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400"><span>✓ Correct</span><span className="text-emerald-400 font-semibold">{correctCount}</span></div>
              <div className="flex justify-between text-gray-400"><span>✗ Wrong</span><span className="text-red-400 font-semibold">{wrongCount}</span></div>
              <div className="flex justify-between text-gray-400"><span>— Skipped</span><span className="text-gray-400 font-semibold">{skippedCount}</span></div>
            </div>
            <div className="mt-auto space-y-2">
              <Button
                onClick={() => setView("results")}
                className="w-full bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 text-xs border-0"
              >
                ← Back to Results
              </Button>
              <Button
                onClick={() => navigate("/profile")}
                className="w-full bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 text-xs border-0"
              >
                Back to Profile
              </Button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (view === "test" && questions.length > 0) {
    const options: Array<{ letter: "A" | "B" | "C" | "D"; text: string }> = [
      { letter: "A", text: q?.optionA ?? "" },
      { letter: "B", text: q?.optionB ?? "" },
      { letter: "C", text: q?.optionC ?? "" },
      { letter: "D", text: q?.optionD ?? "" },
    ];
    const selected = q ? answers[q.id] : undefined;

    return (
      <div className="bg-gray-950 flex flex-col overflow-hidden" style={{ userSelect: "none", height: "100dvh" }}>

        {/* Fixed top-right: timer + warnings stacked so they never overlap */}
        <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-1.5 pointer-events-none">
          <TimerChip seconds={timeLeft} />
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/90 border border-amber-600/50 text-amber-200 text-xs font-semibold px-2 py-1 rounded-xl shadow-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{warningCount}/{MAX_WARNINGS} warnings</span>
              <span className="sm:hidden">{warningCount}/{MAX_WARNINGS}</span>
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className="shrink-0 bg-gray-900/80 border-b border-gray-800 px-3 lg:px-6 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:inline">Technical Evaluation</span>
          </div>
          <div className="flex-1 mx-2 lg:mx-4">
            <ProgressBar answered={answeredCount} total={TOTAL_QUESTIONS} />
          </div>
          {/* spacer that matches the fixed timer column width to prevent progress bar overlap */}
          <div className="w-24 sm:w-32 lg:w-44 shrink-0" />
        </div>

        {/* 3-column body */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* LEFT — Instructions (hidden on screens below lg) */}
          <aside className="hidden lg:flex w-48 xl:w-56 shrink-0 bg-gray-900/60 border-r border-gray-800 flex-col overflow-y-auto p-4 gap-4">
            <div>
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Eye className="w-3 h-3" /> Proctoring Rules
              </p>
              <ul className="space-y-2">
                {[
                  "Do not switch tabs — each focus loss is logged.",
                  `At ${MAX_WARNINGS} violations the test auto-submits.`,
                  "Keep your face visible and centred in the camera frame.",
                  "Only one person should be visible on camera.",
                  "Right-click, copy & paste are disabled.",
                  "DevTools access is blocked.",
                  "Timer runs server-side — closing the tab does not pause it.",
                  "You may navigate between questions freely before submitting.",
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-gray-400 text-xs leading-snug">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>{rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-800 pt-3">
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-purple-600 ring-2 ring-purple-400 shrink-0" />
                  <span className="text-gray-400 text-xs">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-700 shrink-0" />
                  <span className="text-gray-400 text-xs">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-gray-700 shrink-0" />
                  <span className="text-gray-400 text-xs">Unanswered</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3">
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">Scoring</p>
              <p className="text-gray-400 text-xs leading-snug">Pass score: <span className="text-white font-semibold">{sessionInfo?.passThreshold ?? 28}/{TOTAL_QUESTIONS}</span></p>
              <p className="text-gray-400 text-xs leading-snug mt-1">Time limit: <span className="text-white font-semibold">45 minutes</span></p>
            </div>
          </aside>

          {/* CENTER — Question */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Question number strip — single scrollable row */}
            <div className="shrink-0 bg-gray-900/40 border-b border-gray-800 px-4 py-2.5 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {questions.map((qq, idx) => {
                  const isAnswered = !!answers[qq.id];
                  const isCurrent = idx === currentQ;
                  return (
                    <button
                      key={qq.id}
                      onClick={() => setCurrentQ(idx)}
                      className={`w-7 h-7 text-[11px] rounded font-semibold transition-all shrink-0 ${
                        isCurrent
                          ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900"
                          : isAnswered
                          ? "bg-emerald-700/90 text-emerald-100 hover:bg-emerald-600"
                          : "bg-gray-700/80 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question + options */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-500 text-xs font-mono tracking-wide">Q{currentQ + 1} / {TOTAL_QUESTIONS}</span>
                  </div>

                  <div className="mb-5">
                    <QuestionText text={q?.questionText ?? ""} />
                  </div>

                  <div className="space-y-2.5">
                    {options.map(opt => {
                      const isSelected = selected === opt.letter;
                      return (
                        <button
                          key={opt.letter}
                          onClick={() => q && handleAnswer(q.id, opt.letter)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
                            isSelected
                              ? "bg-purple-800/40 border-purple-500/70 text-white shadow-md shadow-purple-900/30"
                              : "bg-gray-800/40 border-gray-700/60 text-gray-300 hover:bg-gray-800/70 hover:border-gray-600"
                          }`}
                        >
                          <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isSelected
                              ? "bg-purple-600 border-purple-400 text-white"
                              : "bg-gray-700 border-gray-600 text-gray-400"
                          }`}>{opt.letter}</span>
                          <span className="text-sm leading-relaxed pt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / Next */}
            <div className="shrink-0 bg-gray-900/60 border-t border-gray-800 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
              <Button
                onClick={() => setCurrentQ(v => Math.max(0, v - 1))}
                disabled={currentQ === 0}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 border-0 px-3 sm:px-5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <span className="text-gray-500 text-xs font-mono hidden sm:inline">{answeredCount} / {TOTAL_QUESTIONS} answered</span>

              <Button
                onClick={() => setCurrentQ(v => Math.min(questions.length - 1, v + 1))}
                disabled={currentQ >= questions.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-30 border-0 px-3 sm:px-5"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </main>

          {/* RIGHT — Camera */}
          <aside className="w-36 sm:w-44 xl:w-52 shrink-0 bg-gray-900/60 border-l border-gray-800 flex flex-col p-2 xl:p-3 gap-2 xl:gap-3">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Proctoring Feed
            </p>

            <div className="relative rounded-xl overflow-hidden bg-gray-800/60 border border-gray-700/50" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${cameraStatus === "active" ? "block" : "hidden"}`}
              />
              {cameraStatus !== "active" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                  <CameraOff className="w-8 h-8 text-gray-600" />
                  <p className="text-gray-500 text-xs text-center leading-snug">
                    {cameraStatus === "denied"
                      ? "Camera permission denied"
                      : cameraStatus === "pending"
                      ? "Requesting camera…"
                      : "Camera unavailable"}
                  </p>
                </div>
              )}
              {cameraStatus === "active" && (
                <>
                  {/* REC badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-[10px] font-bold">REC</span>
                  </div>

                  {/* Face status overlays */}
                  {faceStatus === "not_visible" && (
                    <div className="absolute inset-x-2 bottom-2 bg-red-900/90 border border-red-600/60 rounded-lg px-2 py-1 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-300 shrink-0" />
                      <span className="text-red-200 text-[10px] font-bold">Face not visible</span>
                    </div>
                  )}
                  {faceStatus === "looking_away" && (
                    <div className="absolute inset-x-2 bottom-2 bg-amber-900/90 border border-amber-600/60 rounded-lg px-2 py-1 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                      <span className="text-amber-200 text-[10px] font-bold">Looking away</span>
                    </div>
                  )}
                  {faceStatus === "multiple" && (
                    <div className="absolute inset-x-2 bottom-2 bg-red-950/90 border border-red-500/70 rounded-lg px-2 py-1 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-300 shrink-0" />
                      <span className="text-red-200 text-[10px] font-bold">Multiple faces!</span>
                    </div>
                  )}
                  {faceStatus === "visible" && (
                    <div className="absolute bottom-2 left-2 bg-green-900/70 border border-green-700/40 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-green-300 text-[9px] font-semibold">Face OK</span>
                    </div>
                  )}
                  {faceStatus === "detecting" && (
                    <div className="absolute bottom-2 left-2 bg-gray-900/70 rounded px-1.5 py-0.5">
                      <span className="text-gray-400 text-[9px]">Initialising…</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-gray-600 text-[10px] leading-snug text-center hidden xl:block">
              Your camera feed is recorded for proctoring. Ensure your face is clearly visible.
            </p>

            <div className="border-t border-gray-800 pt-2 mt-auto">
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1.5 hidden sm:block">Session</p>
              <p className="text-gray-400 text-xs">Q: <span className="text-white">{TOTAL_QUESTIONS}</span></p>
              <p className="text-gray-400 text-xs mb-1">Violations: <span className={`font-semibold ${warningCount > 0 ? "text-amber-400" : "text-gray-400"}`}>{warningCount}/{MAX_WARNINGS}</span></p>
              {multiScreenDetected && (
                <p className="text-red-400 text-[10px] mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> Multi-screen
                </p>
              )}
              <div className="mb-2" />
              <Button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs px-2 py-2 h-auto"
              >
                {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting…</> : "Submit Test ✓"}
              </Button>
            </div>
          </aside>
        </div>

        {/* Submit confirmation dialog */}
        <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <AlertDialogContent className="bg-gray-900 border border-gray-700 text-white max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" /> Ready to submit?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm space-y-2 pt-1">
                <span className="block">
                  You have answered <strong className="text-white">{answeredCount}</strong> of <strong className="text-white">{TOTAL_QUESTIONS}</strong> questions.
                </span>
                {answeredCount < TOTAL_QUESTIONS && (
                  <span className="block text-amber-400 font-medium">
                    ⚠ {TOTAL_QUESTIONS - answeredCount} question{TOTAL_QUESTIONS - answeredCount > 1 ? "s" : ""} left unanswered — unanswered questions will be marked incorrect.
                  </span>
                )}
                <span className="block pt-1">Once submitted, you cannot go back. Are you sure?</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setShowSubmitConfirm(false); doSubmit(answers); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold border-0"
              >
                Yes, Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    </div>
  );
}

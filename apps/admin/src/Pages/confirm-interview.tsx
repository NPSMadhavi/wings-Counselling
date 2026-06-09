import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Calendar, Clock, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface InterviewDetails {
    jobTitle: string;
    jobId: string;
    scheduledDate: string;
    scheduledTime: string;
    alreadyConfirmed: boolean;
}

export default function ConfirmInterview() {
    const { toast } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        setToken(tokenParam);

        if (tokenParam) {
            fetch(`/api/confirm-interview/${tokenParam}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setInterviewDetails(data.interviewDetails);
                        if (data.interviewDetails.alreadyConfirmed) {
                            setConfirmed(true);
                        }
                    } else {
                        setError(data.message || 'Failed to load interview details');
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to load interview details');
                    setLoading(false);
                });
        } else {
            setError('Invalid confirmation link');
            setLoading(false);
        }
    }, []);

    const confirmMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/confirm-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to confirm interview');
            }
            return res.json();
        },
        onSuccess: () => {
            setConfirmed(true);
            toast({ title: "Success", description: "Interview confirmed! You will receive a confirmation email shortly." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
            <Navbar />

            <section className="pt-32 sm:pt-40 pb-20 min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-lg mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.04)] font-['DM_Sans']"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center py-12">
                                    <Loader2 className="w-12 h-12 text-[#1B4585] animate-spin mb-4" />
                                    <p className="text-gray-500 font-semibold">Loading interview details...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-black font-['Outfit'] mb-2">Error</h2>
                                    <p className="text-gray-600">{error}</p>
                                </div>
                            ) : confirmed ? (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    >
                                        <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-black font-['Outfit'] mb-2">Interview Confirmed!</h2>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Thank you for confirming your interview. You will receive a confirmation email with all the details shortly.
                                    </p>

                                    {interviewDetails && (
                                        <div className="w-full bg-[#FAFAF5] border border-gray-200 rounded-xl p-5 text-left">
                                            <div className="flex items-center gap-3 mb-4 text-[#1B4585]">
                                                <Briefcase className="w-5 h-5" />
                                                <span className="font-bold">{interviewDetails.jobTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-2 text-gray-700 font-medium">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <span>{formatDate(interviewDetails.scheduledDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-700 font-medium">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                                <span>{formatTime(interviewDetails.scheduledTime)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-8">
                                        Our team will reach out to you with further details about the interview process.
                                    </p>
                                </div>
                            ) : interviewDetails ? (
                                <div className="py-4">
                                    <div className="text-center mb-8">
                                        <Calendar className="w-16 h-16 text-[#1B4585] mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold text-black font-['Outfit'] mb-2">Confirm Your Interview</h2>
                                        <p className="text-gray-500">Please confirm your attendance for the scheduled interview.</p>
                                    </div>

                                    <div className="bg-[#FAFAF5] border border-gray-200 rounded-xl p-6 mb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Briefcase className="w-5 h-5 text-[#1B4585]" />
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Position</p>
                                                <p className="text-black font-bold text-base leading-tight mt-1">{interviewDetails.jobTitle}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">Job ID: {interviewDetails.jobId}</p>

                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Interview Schedule</p>
                                            <div className="flex items-center gap-3 mb-2 text-gray-700 font-medium">
                                                <Calendar className="w-5 h-5 text-[#0D4A7A]" />
                                                <span>{formatDate(interviewDetails.scheduledDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-700 font-medium">
                                                <Clock className="w-5 h-5 text-[#0D4A7A]" />
                                                <span>{formatTime(interviewDetails.scheduledTime)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => confirmMutation.mutate()}
                                        disabled={confirmMutation.isPending}
                                        className="w-full bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold py-6 text-lg shadow-sm"
                                        data-testid="button-confirm-interview"
                                    >
                                        {confirmMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
                                                Confirming...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Confirm Interview
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-gray-400 text-center mt-6">
                                        By confirming, you agree to attend the interview at the scheduled date and time.
                                    </p>
                                </div>
                            ) : null}
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

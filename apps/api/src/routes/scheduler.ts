import { storage } from "./storage";
import { sendApplicationStatusUpdate, sendScreeningReminderEmail, sendScreeningNonResponsiveRejection } from "./email";

const SCHEDULER_INTERVAL_MS = 15 * 1000; // run every 15 seconds

async function runSchedulerTick() {
    try {
        await processAutoUnderReview();
        await processScreeningReminders();
        await processAutoRejects();
    } catch (err) {
        console.error('[Scheduler] Error during tick:', err);
    }
}

async function processAutoUnderReview() {
    const apps = await storage.getPendingAppsForAutoUnderReview();
    for (const app of apps) {
        try {
            await storage.moveAppToUnderReview(app.id);
            await sendApplicationStatusUpdate(
                app.userEmail,
                app.userFirstName,
                app.jobTitle,
                app.jobId,
                'Under Review'
            );
            console.log(`[Scheduler] Auto moved app #${app.id} to Under Review and sent screening email.`);
        } catch (err) {
            console.error(`[Scheduler] Failed to auto move app #${app.id} to Under Review:`, err);
        }
    }
}

async function processScreeningReminders() {
    const apps = await storage.getUnderReviewAppsNeedingReminder();
    for (const app of apps) {
        try {
            const currentCount = app.screeningReminderCount ?? 0;
            const nextCount = currentCount + 1;
            await storage.updateAppReminderSent(app.id, nextCount);
            await sendScreeningReminderEmail(
                app.userEmail,
                app.userFirstName,
                app.jobTitle,
                app.jobId,
                nextCount
            );
            console.log(`[Scheduler] Sent reminder #${nextCount} for app #${app.id}.`);
        } catch (err) {
            console.error(`[Scheduler] Failed to send reminder for app #${app.id}:`, err);
        }
    }
}

async function processAutoRejects() {
    const apps = await storage.getUnderReviewAppsToAutoReject();
    for (const app of apps) {
        try {
            await storage.autoRejectNonResponsiveApp(app.id);
            await sendScreeningNonResponsiveRejection(
                app.userEmail,
                app.userFirstName,
                app.jobTitle,
                app.jobId
            );
            console.log(`[Scheduler] Auto-rejected app #${app.id} for non-responsive candidate.`);
        } catch (err) {
            console.error(`[Scheduler] Failed to auto-reject app #${app.id}:`, err);
        }
    }
}

export function startScheduler() {
    console.log('[Scheduler] Starting automated screening scheduler...');
    runSchedulerTick();
    setInterval(runSchedulerTick, SCHEDULER_INTERVAL_MS);
}

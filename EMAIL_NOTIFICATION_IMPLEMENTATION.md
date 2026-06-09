# Email Notification Implementation for Application Status Updates

## Overview
This document describes the implementation of automatic email notifications that are sent to applicants whenever their application status is updated by the admin.

## Changes Made

### 1. Email Function (`apps/api/src/lib/email.js`)

Added a new function `sendApplicationStatusUpdateEmail()` that:

- **Sends personalized emails** to candidates when their application status changes
- **Includes status-specific messages** for all application statuses including:
  - Pending, Under Review, Shortlisted
  - Round 1/2/3 Scheduled, Confirmed, Completed, Selected, Not Selected
  - Reschedule Round 1/2/3
  - Final Selected, Offer Extended, Onboarded
  - Rejected, Not Selected, Withdrawn by Candidate, Position Closed
  
- **Features beautiful email templates** using the existing WINGS mental health themed design
- **Includes recruiter remarks** if provided by the admin
- **Provides clear next steps** for the candidate

### 2. Backend API Routes (`apps/api/src/routes/applications.js`)

Updated two endpoints to automatically send email notifications:

#### a) `PUT /admin/applications/:id`
- When admin updates application status via this endpoint
- Fetches candidate email, name, job title, and job code
- Sends email notification with the new status and any admin notes
- Broadcasts success/failure to admin dashboard via SSE

#### b) `PATCH /admin/applications/:id/status`
- When admin updates application status via this endpoint (used by frontend)
- Fetches candidate email, name, job title, and job code
- Sends email notification with the new status and any internal remarks
- Broadcasts success/failure to admin dashboard via SSE

## How It Works

### Workflow:
1. **Admin updates application status** in the CareersAdmin panel
2. **Backend saves the status** to the database
3. **Backend fetches candidate details** (email, name, job info)
4. **Email is sent automatically** to the candidate with:
   - Personalized greeting
   - Status update with emoji and color coding
   - Status-specific message explaining what happens next
   - Recruiter remarks (if any)
   - Call-to-action to check candidate portal
5. **Admin receives notification** via SSE about email success/failure
6. **Response is sent** back to frontend confirming the update

### Email Content Structure:
```
┌─────────────────────────────────────┐
│  WINGS Header (Mental Health Theme) │
├─────────────────────────────────────┤
│  Personal Greeting                  │
│  "Hello, [FirstName]"               │
├─────────────────────────────────────┤
│  Status Update Card                 │
│  [Emoji] [Status]                   │
│  Status-specific message            │
├─────────────────────────────────────┤
│  Recruiter Remarks (if provided)    │
├─────────────────────────────────────┤
│  What's Next Section                │
├─────────────────────────────────────┤
│  Closing & Team Signature           │
├─────────────────────────────────────┤
│  Mental Health Resources Footer     │
└─────────────────────────────────────┘
```

## Status Messages

Each status has a unique message:

| Status | Message |
|--------|---------|
| **Shortlisted** | Congratulations! You have been shortlisted for the next round. |
| **Round 1 Selected** | Congratulations! You have cleared Round 1 and are moving to Round 2. |
| **Round 2 Selected** | Congratulations! You have cleared Round 2 and are moving to Round 3. |
| **Round 3 Selected** | Congratulations! You have successfully completed all interview rounds. The offer process will begin shortly. |
| **Final Selected** | Congratulations! You have been selected for the position. Our team will reach out with the offer details. |
| **Offer Extended** | An offer has been extended to you. Please check your email for the offer details. |
| **Onboarded** | Welcome to the team! Your onboarding process has been initiated. |
| **Not Selected** | Thank you for your interest. Unfortunately, we have decided to move forward with other candidates at this time. |

## Testing

To test the email notifications:

1. **Start the API server**:
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Ensure SMTP is configured** in `.env`:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

3. **Update an application status** in the admin panel:
   - Go to Careers Admin
   - Select an application
   - Change the status
   - Add remarks (optional)
   - Click "Save Status"

4. **Check the candidate's email** for the notification

5. **Check the console logs** for email sending status:
   ```
   [Email] Application status update sent to: candidate@example.com
   ```

## Important Notes

- **No code or functionality was changed** in the frontend or existing features
- **Email sending is asynchronous** (fire-and-forget) so it doesn't block the status update
- **Email failures are logged** but don't prevent the status update from succeeding
- **Admin receives real-time notifications** about email success/failure via SSE
- **All existing email templates** and styling are preserved
- **SMTP configuration** must be properly set up for emails to send

## Benefits

✅ **Automatic notifications** - No manual email sending required  
✅ **Professional communication** - Consistent, branded emails  
✅ **Better candidate experience** - Timely updates on application status  
✅ **Transparency** - Candidates know exactly where they stand  
✅ **Reduced admin workload** - No need to manually notify candidates  
✅ **Audit trail** - All email events are logged and broadcast to admin

## Future Enhancements (Optional)

- Add email templates for interview scheduling
- Include calendar invites for scheduled interviews
- Add unsubscribe functionality
- Track email open rates
- Add SMS notifications for critical status changes

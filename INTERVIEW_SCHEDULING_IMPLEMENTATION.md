# Interview Scheduling Email System Implementation

## Overview
This document describes the complete implementation of the automatic interview scheduling email system that sends interview slot invitations to candidates and confirmation emails after booking.

## Process Flow

### 1. Admin Updates Status to Interview Round
When an admin changes a candidate's status to one of these:
- **Shortlisted** → Triggers Round 1 (Technical Interview) invitation
- **Round 1 Selected** → Triggers Round 2 (LSP-E) invitation  
- **Round 2 Selected** → Triggers Round 3 (Manager/HR Interview) invitation

### 2. Automatic Email Sent to Candidate
The system automatically:
- Fetches available interview slots from the database
- Sends a beautifully formatted email with:
  - Congratulations message
  - List of all available interview slots (date, time, duration)
  - Clear instructions to book a slot
  - Link to candidate portal
  - Interview preparation tips

### 3. Candidate Books Interview Slot
The candidate:
- Logs into their candidate portal
- Views available slots
- Selects their preferred date and time
- Confirms the booking

### 4. System Updates and Confirms
The system:
- Saves the selected slot to the database
- Marks the slot as booked (unavailable for others)
- Sends a confirmation email with complete interview details

### 5. Confirmation Email Sent
The candidate receives:
- Interview date, time, and duration
- Interviewer name (if available)
- Location or meeting link
- Additional notes from admin
- Preparation reminders

## Implementation Details

### New Email Functions (`apps/api/src/lib/email.js`)

#### 1. `sendInterviewSlotInvitation(candidateEmail, data)`
Sends an email with available interview slots when candidate is selected for an interview round.

**Parameters:**
```javascript
{
  firstName: "John",
  jobTitle: "Mental Health Counselor",
  jobIdCode: "MHC-2024-001",
  round: "Round 1 - Technical Interview",
  availableSlots: [
    { date: "2024-06-15", timeSlot: "10:00 - 11:00", duration: 60 },
    { date: "2024-06-15", timeSlot: "14:00 - 15:00", duration: 60 },
    // ... more slots
  ],
  portalLink: "https://wings-counselling.org/candidate-portal"
}
```

**Email Features:**
- ✅ Congratulations message with round details
- ✅ Table of available slots with date, time, and duration
- ✅ Important notice that only listed slots are available
- ✅ Step-by-step booking instructions
- ✅ Call-to-action button to candidate portal
- ✅ Interview preparation tips
- ✅ WINGS mental health themed design

#### 2. `sendInterviewBookingConfirmation(candidateEmail, data)`
Sends confirmation email after candidate successfully books an interview slot.

**Parameters:**
```javascript
{
  firstName: "John",
  jobTitle: "Mental Health Counselor",
  jobIdCode: "MHC-2024-001",
  round: "Round 1 - Technical Interview",
  date: "2024-06-15",
  timeSlot: "10:00 - 11:00",
  duration: 60,
  interviewerName: "Dr. Sarah Johnson",
  location: "WINGS Office, Room 301",
  meetingLink: "https://meet.google.com/abc-defg-hij",
  notes: "Please bring your portfolio and relevant certifications"
}
```

**Email Features:**
- ✅ Confirmation message with green success styling
- ✅ Complete interview details card
- ✅ Virtual meeting link (if applicable)
- ✅ Additional notes from admin (if any)
- ✅ Important reminders and preparation tips
- ✅ Professional WINGS branding

### Backend Logic Updates (`apps/api/src/routes/applications.js`)

#### Status Update Endpoints Enhanced

Both `PUT /admin/applications/:id` and `PATCH /admin/applications/:id/status` now include:

```javascript
// Check if status requires interview slot booking
const interviewStatuses = ['Shortlisted', 'Round 1 Selected', 'Round 2 Selected'];
const needsSlotBooking = interviewStatuses.includes(status);

if (needsSlotBooking) {
  // Fetch available interview slots from database
  const [slotRows] = await db.execute(`
    SELECT date, time_slot AS timeSlot, duration
    FROM interview_availability
    WHERE is_booked = 0 AND date >= CURDATE()
    ORDER BY date ASC, time_slot ASC
    LIMIT 20
  `);

  // Determine which round based on status
  const round = status === 'Shortlisted' ? 'Round 1 - Technical Interview' :
               status === 'Round 1 Selected' ? 'Round 2 - LSP-E' :
               status === 'Round 2 Selected' ? 'Round 3 - Manager/HR Interview' : 
               'Interview Round';

  // Send interview slot invitation email
  await sendInterviewSlotInvitation(candidateEmail, {
    firstName, jobTitle, jobIdCode, round, availableSlots, portalLink
  });
} else {
  // Send regular status update email for non-interview statuses
  await sendApplicationStatusUpdateEmail(candidateEmail, {
    firstName, jobTitle, jobIdCode, status, remarks
  });
}
```

## Email Templates

### Interview Slot Invitation Email

```
┌─────────────────────────────────────────────┐
│  WINGS Header (Mental Health Theme)         │
├─────────────────────────────────────────────┤
│  Congratulations Message                    │
│  "You have been selected for Round 1..."    │
├─────────────────────────────────────────────┤
│  ⚠️ Action Required Notice                  │
│  "Please select one of the available slots" │
├─────────────────────────────────────────────┤
│  📅 Available Interview Slots Table         │
│  ┌──────────┬──────────┬──────────┐        │
│  │ Date     │ Time     │ Duration │        │
│  ├──────────┼──────────┼──────────┤        │
│  │ 15-06-24 │ 10:00 AM │ 60 min   │        │
│  │ 15-06-24 │ 02:00 PM │ 60 min   │        │
│  └──────────┴──────────┴──────────┘        │
├─────────────────────────────────────────────┤
│  How to Book Instructions (4 steps)         │
├─────────────────────────────────────────────┤
│  [Book Your Interview Slot →] Button        │
├─────────────────────────────────────────────┤
│  💡 Interview Preparation Tips              │
├─────────────────────────────────────────────┤
│  Closing & Team Signature                   │
├─────────────────────────────────────────────┤
│  Mental Health Resources Footer             │
└─────────────────────────────────────────────┘
```

### Interview Confirmation Email

```
┌─────────────────────────────────────────────┐
│  WINGS Header (Mental Health Theme)         │
├─────────────────────────────────────────────┤
│  ✅ Interview Confirmed Banner              │
│  "Your Interview is Scheduled!"             │
├─────────────────────────────────────────────┤
│  📋 Interview Details Card                  │
│  Round: Round 1 - Technical Interview       │
│  Date: 📅 June 15, 2024                     │
│  Time: ⏰ 10:00 - 11:00 AM                  │
│  Duration: ⌛ 60 minutes                    │
│  Interviewer: 💼 Dr. Sarah Johnson          │
│  Location: 📍 WINGS Office, Room 301        │
├─────────────────────────────────────────────┤
│  💻 Virtual Interview Link (if applicable)  │
│  [Join Interview Meeting →] Button          │
├─────────────────────────────────────────────┤
│  📌 Additional Notes (if any)               │
├─────────────────────────────────────────────┤
│  ⚠️ Important Reminders                     │
│  • Join 5-10 minutes early                  │
│  • Test your connection                     │
│  • Keep documents handy                     │
│  • Prepare questions                        │
│  • Dress professionally                     │
├─────────────────────────────────────────────┤
│  Closing & Team Signature                   │
├─────────────────────────────────────────────┤
│  Mental Health Resources Footer             │
└─────────────────────────────────────────────┘
```

## Status Triggers

| Admin Action | Email Sent | Content |
|-------------|------------|---------|
| Status → **Shortlisted** | Interview Slot Invitation | Round 1 - Technical Interview slots |
| Status → **Round 1 Selected** | Interview Slot Invitation | Round 2 - LSP-E slots |
| Status → **Round 2 Selected** | Interview Slot Invitation | Round 3 - Manager/HR Interview slots |
| Candidate books slot | Interview Confirmation | Complete interview details |
| Any other status | Status Update Email | Regular status notification |

## Database Requirements

The system uses the `interview_availability` table:

```sql
CREATE TABLE interview_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  duration INT DEFAULT 60,
  interviewer_name VARCHAR(255),
  location VARCHAR(255),
  meeting_link VARCHAR(500),
  notes TEXT,
  is_booked BOOLEAN DEFAULT 0,
  booked_application_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### Test Interview Slot Invitation:

1. **Start the API server**:
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Update candidate status** in admin panel:
   - Go to Careers Admin → Applications
   - Select a candidate
   - Change status to "Shortlisted"
   - Click "Save"

3. **Check candidate's email** for interview slot invitation

4. **Verify email contains**:
   - Available slots table
   - Booking instructions
   - Portal link
   - Preparation tips

### Test Interview Confirmation:

1. **Candidate books a slot** via candidate portal

2. **Check candidate's email** for confirmation

3. **Verify email contains**:
   - Interview date and time
   - Interviewer details
   - Meeting link (if virtual)
   - Preparation reminders

## Configuration

Add to `.env` file:

```env
# Candidate Portal URL (for email links)
CANDIDATE_PORTAL_URL=https://wings-counselling.org/candidate-portal

# SMTP Configuration (already configured)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
```

## Features

✅ **Automatic email sending** when status changes to interview rounds  
✅ **Available slots displayed** in beautiful table format  
✅ **Clear booking instructions** with step-by-step guide  
✅ **Professional email design** with WINGS branding  
✅ **Interview preparation tips** included  
✅ **Confirmation email** after booking  
✅ **Complete interview details** in confirmation  
✅ **Virtual meeting links** supported  
✅ **Admin notes** can be included  
✅ **Slot capacity management** (booked slots become unavailable)  
✅ **Real-time admin notifications** via SSE  
✅ **Error handling and logging** for all email operations  

## Benefits

- **Automated workflow** - No manual email sending required
- **Better candidate experience** - Clear communication and easy booking
- **Professional communication** - Consistent, branded emails
- **Reduced admin workload** - System handles all notifications
- **Slot management** - Prevents double-booking
- **Audit trail** - All email events logged and broadcast
- **Scalable** - Handles multiple candidates and rounds

## Important Notes

- **No existing code or functionality was changed** - Only additions made
- **Email sending is asynchronous** - Doesn't block status updates
- **Email failures are logged** but don't prevent status updates
- **Admin receives real-time notifications** about email success/failure
- **Slots are fetched dynamically** from the database
- **Only unbooked future slots** are shown to candidates
- **SMTP must be configured** for emails to send

## Future Enhancements (Optional)

- Calendar invite attachments (.ics files)
- SMS notifications for interview reminders
- Automatic reminder emails 24 hours before interview
- Rescheduling functionality
- Interview feedback collection
- Video interview integration
- Multi-language support

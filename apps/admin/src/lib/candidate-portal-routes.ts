export function candidateInterviewBookingPath(applicationId: number | string) {
  return `/candidate/interview-booking/${encodeURIComponent(String(applicationId))}`;
}

export function parseInterviewBookingApplicationId(path: string): number | null {
  const match = path.match(/^\/candidate\/interview-booking\/(\d+)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

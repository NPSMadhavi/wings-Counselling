/** Public URL for the careers application form (opens in its own path/tab). */
export function careersApplyPath(jobId: string): string {
  return `/career/apply/${encodeURIComponent(jobId)}`;
}

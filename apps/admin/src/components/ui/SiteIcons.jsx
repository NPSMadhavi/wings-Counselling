import { MapPin, Calendar, Clock } from "lucide-react";

/** Standard site-wide icon tokens (Events page reference) */
export const SITE_ICON_COLOR = "#1E3A8A";
export const SITE_ICON_STROKE = 2;
export const SITE_ICON_SIZE_SM = 16;
export const SITE_ICON_SIZE_MD = 20;
export const SITE_ICON_SIZE_LG = 24;

export function SiteMapPinIcon({
  size = SITE_ICON_SIZE_SM,
  color = SITE_ICON_COLOR,
  className = "",
  ...props
}) {
  return (
    <MapPin
      size={size}
      color={color}
      strokeWidth={SITE_ICON_STROKE}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
}

export function SiteCalendarIcon({
  size = SITE_ICON_SIZE_SM,
  color = SITE_ICON_COLOR,
  className = "",
  ...props
}) {
  return (
    <Calendar
      size={size}
      color={color}
      strokeWidth={SITE_ICON_STROKE}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
}

export function SiteClockIcon({
  size = SITE_ICON_SIZE_SM,
  color = SITE_ICON_COLOR,
  className = "",
  ...props
}) {
  return (
    <Clock
      size={size}
      color={color}
      strokeWidth={SITE_ICON_STROKE}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
}

/** Tick/check mark from About Us → Our Impact section */
export function SiteCheckIcon({
  size = 18,
  color = "#0D4A7A",
  className = "",
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5 13L9 17L19 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Our Impact list badge — circle + check */
export function SiteCheckBadge({
  size = 36,
  iconSize = 18,
  background = "#8EC9F0",
  color = "#0D4A7A",
  className = "",
}) {
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, background }}
    >
      <SiteCheckIcon size={iconSize} color={color} />
    </div>
  );
}

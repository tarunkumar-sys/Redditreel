// SecurityInitializer has been removed — client-side devtools blocking
// (F12, right-click, console suppression) provided no real security benefit
// and harmed legitimate users. Server-side utilities (validateOrigin,
// RateLimiter, sanitizeForLogging) in lib/security.ts remain in use.
export default function SecurityInitializer() {
  return null;
}

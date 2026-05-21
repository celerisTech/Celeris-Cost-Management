export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Decode a JWT payload safely (base64url). Returns an object or null.
export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    // base64url -> base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // pad if needed
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
    // Convert binary string to UTF-8
    const utf8 = decodeURIComponent(
      json.split("").map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`).join("")
    );
    return JSON.parse(utf8);
  } catch (e) {
    // Invalid token or not a JWT
    return null;
  }
}

// Returns true if token has exp and is expired (considers optional clock skew in seconds)
export function isTokenExpired(token, clockSkewSec = 60) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    // If not a JWT or no exp claim, we can't assert expiry here
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return now >= (payload.exp - clockSkewSec);
}

// Boolean validity check: has a value and not expired if exp exists
export function isTokenValid(token, clockSkewSec = 60) {
  if (!token) return false;
  return !isTokenExpired(token, clockSkewSec);
}

// Get a token from cookie and ensure it is valid. Returns token or null.
export function getValidToken(cookieName = "ccms_token", clockSkewSec = 60) {
  const token = getCookie(cookieName);
  if (!token) return null;
  return isTokenValid(token, clockSkewSec) ? token : null;
}

// Helper to build Authorization header if there is a valid token
export function getAuthHeader(cookieName = "token", clockSkewSec = 60) {
  const token = getValidToken(cookieName, clockSkewSec);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
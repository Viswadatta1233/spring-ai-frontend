const JWT_COOKIE_NAME = "springBootEcom";

/**
 * JWT for API calls. Prefer localStorage (set on login); fall back to cookie (httpOnly is false).
 * Needed for fetch-based assistant streaming and cross-origin Render when cookies are not sent.
 */
export function getAuthToken() {
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
        try {
            const auth = JSON.parse(authRaw);
            const token = auth?.jwtToken;
            if (token && typeof token === "string" && !token.includes("=")) {
                return token;
            }
        } catch {
            // ignore
        }
    }

    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${JWT_COOKIE_NAME}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
}

export function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

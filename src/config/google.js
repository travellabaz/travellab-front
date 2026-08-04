// OAuth client IDs aren't secrets — this ends up in the public JS bundle
// regardless of how it's stored, so it's hardcoded directly rather than
// routed through an env var. Must match google.oauth.client-id in
// site-backend's application*.yml exactly, since the backend checks it as
// the token's audience.
export const GOOGLE_CLIENT_ID = '738014137628-kthokrumvtc3897t182d3cd7h07jvk6e.apps.googleusercontent.com';

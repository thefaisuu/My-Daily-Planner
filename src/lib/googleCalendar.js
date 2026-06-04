/**
 * Google Calendar Integration
 * Uses Google Identity Services (GIS) for OAuth 2.0
 * and Fetch API to call Google Calendar REST API.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES    = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_KEY = 'gCal_access_token';
const EXPIRY_KEY = 'gCal_token_expiry';

let tokenClient = null;
let _resolveAuth = null;

/* ── Load GIS script dynamically ── */
export function loadGISScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) return resolve();
    const script = document.createElement('script');
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

/* ── Init token client ── */
async function getTokenClient() {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set.');
  await loadGISScript();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      callback:  (response) => {
        if (response.error) {
          if (_resolveAuth) _resolveAuth({ error: response.error });
          return;
        }
        const expiry = Date.now() + (response.expires_in - 60) * 1000;
        localStorage.setItem(TOKEN_KEY,  response.access_token);
        localStorage.setItem(EXPIRY_KEY, String(expiry));
        if (_resolveAuth) _resolveAuth({ token: response.access_token });
      },
    });
  }
  return tokenClient;
}

/* ── Check if token is still valid ── */
export function getStoredToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0');
  if (token && Date.now() < expiry) return token;
  return null;
}

/* ── Connect / re-auth ── */
export async function connectGoogleCalendar() {
  const client = await getTokenClient();
  return new Promise((resolve) => {
    _resolveAuth = resolve;
    client.requestAccessToken({ prompt: 'consent' });
  });
}

/* ── Disconnect ── */
export function disconnectGoogleCalendar() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

/* ── Create a single event in Google Calendar ── */
export async function createGCalEvent(token, { task, date, startTime, endTime, note, cat }) {
  const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body = {
    summary:     task,
    description: note ? `${note}\n\nCategory: ${cat}` : `Category: ${cat}`,
    start: { dateTime: `${date}T${startTime}:00`, timeZone: tz },
    end:   { dateTime: `${date}T${endTime}:00`,   timeZone: tz },
    colorId: catToColorId(cat),
    source:  { title: 'My Daily Planner', url: window.location.origin },
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create event');
  }
  return res.json();
}

/* ── Sync all filled slots to Google Calendar ── */
export async function syncAllToGoogleCalendar(token, slotData) {
  const results = { success: 0, failed: 0, errors: [] };
  const entries = Object.entries(slotData).filter(([, s]) => s?.task?.trim());

  for (const [, slot] of entries) {
    try {
      await createGCalEvent(token, slot);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }
  }
  return results;
}

/* ── Map category to Google Calendar color ── */
function catToColorId(cat) {
  const map = { work: '11', personal: '9', health: '2', focus: '3', break: '5' };
  return map[cat] || '1';
}

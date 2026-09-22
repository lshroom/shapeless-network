// Shapeless — real persistence + auth over Supabase (same project/Google
// provider as world/1973). This is no longer inside a claude.ai Artifact
// sandbox, so unlike the prototype we can load a real CDN script here.
(function () {
  const URL = 'https://yaxucqsvtmyvyyprrodv.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheHVjcXN2dG15dnl5cHJyb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzM0NzAsImV4cCI6MjA5NjcwOTQ3MH0.29vJeqhKIcvnGsja50imCZ5Z17eRNjm9wsFPiq52Q10';

  const client = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'shapeless-auth' },
  });

  async function rest(path, opts = {}) {
    const { data: { session } } = await client.auth.getSession();
    const token = session?.access_token || KEY;
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: opts.prefer || 'return=representation',
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // ---- auth ----
  let currentUser = null; // { id, name, picture } or null
  const authListeners = [];
  function notifyAuth() { authListeners.forEach(fn => { try { fn(currentUser); } catch (_) {} }); }

  async function ensureProfile(sessionUser) {
    const name = sessionUser.user_metadata?.full_name || sessionUser.email || 'Someone';
    const picture = sessionUser.user_metadata?.avatar_url || null;
    try {
      const rows = await rest(`shapeless_profiles?id=eq.${sessionUser.id}&select=*`);
      if (!rows || !rows.length) {
        await rest('shapeless_profiles', { method: 'POST', body: JSON.stringify([{ id: sessionUser.id, name, picture }]), prefer: 'return=minimal' }).catch(() => {});
      }
    } catch (_) { /* profile table unreachable — fall through with session data */ }
    currentUser = { id: sessionUser.id, name, picture };
  }

  client.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) ensureProfile(session.user).then(notifyAuth);
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) { currentUser = null; notifyAuth(); return; }
    if (event === 'TOKEN_REFRESHED') return;
    ensureProfile(session.user).then(notifyAuth);
  });

  window.SB = {
    // ---- auth ----
    onAuthChange: (fn) => { authListeners.push(fn); if (currentUser !== undefined) fn(currentUser); },
    getUser: () => currentUser,
    signInWithGoogle: () => client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    signOut: () => client.auth.signOut(),

    // ---- seeds ----
    listSeeds: () => rest('shapeless_seeds?select=*&order=created_at.asc'),
    insertSeed: (row) => rest('shapeless_seeds', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    updateSeed: (id, patch) => rest(`shapeless_seeds?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    bulkInsertSeeds: (rows) => rest('shapeless_seeds', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- voyages ----
    listVoyages: () => rest('shapeless_voyages?select=*&order=created_at.desc'),
    insertVoyage: (row) => rest('shapeless_voyages', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    updateVoyage: (id, patch) => rest(`shapeless_voyages?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    bulkInsertVoyages: (rows) => rest('shapeless_voyages', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- messages ----
    listMessages: () => rest('shapeless_messages?select=*&order=created_at.asc'),
    insertMessage: (row) => rest('shapeless_messages', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),
    bulkInsertMessages: (rows) => rest('shapeless_messages', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- retreat rsvps ----
    listRsvpCounts: async () => {
      const rows = await rest('shapeless_retreat_rsvps?select=date_iso');
      const counts = {};
      (rows || []).forEach(r => { counts[r.date_iso] = (counts[r.date_iso] || 0) + 1; });
      return counts;
    },
    insertRsvp: (dateIso) => rest('shapeless_retreat_rsvps', { method: 'POST', body: JSON.stringify([{ date_iso: dateIso, name: currentUser?.name || 'You', author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),

    // ---- join submissions ----
    insertJoinSubmission: (row) => rest('shapeless_join_submissions', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),

    // ---- page content (in-place editor) ----
    listPageContent: () => rest('shapeless_page_content?select=*'),
    upsertPageContent: (rows) => rest('shapeless_page_content?on_conflict=key', { method: 'POST', body: JSON.stringify(rows.map(r => ({ ...r, updated_by: currentUser?.id || null }))), prefer: 'resolution=merge-duplicates,return=minimal' }),

    // ---- roadmap ----
    listRoadmap: () => rest('shapeless_roadmap_items?select=*&order=sort_order.asc'),
    bulkInsertRoadmap: (rows) => rest('shapeless_roadmap_items', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- realtime ----
    // fn receives (table, payload) for every INSERT/UPDATE on the given tables
    subscribeRealtime: (tables, fn) => {
      const channel = client.channel('shapeless-live');
      tables.forEach(table => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => fn(table, payload));
      });
      channel.subscribe();
      return () => client.removeChannel(channel);
    },
  };
})();

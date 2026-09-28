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
    // getSession() refreshes an expired token using the stored refresh token.
    // If that refresh silently fails (revoked/expired refresh token — common
    // after a mobile tab sits backgrounded for a while), session comes back
    // null even though the UI still shows the user as signed in (currentUser
    // is a separate variable that isn't cleared just because a background
    // refresh failed). Writes then went out on the anon key and got rejected
    // by RLS with no visible error — that was the "jam never saved" bug.
    const { data: { session } } = await client.auth.getSession();
    if (!session && currentUser) {
      currentUser = null;
      notifyAuth();
      throw new Error('signed out — please sign in again');
    }
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
  const ADMIN_EMAIL = 'betterbarak@gmail.com';
  let currentUser = null; // { id, name, picture, email, isAdmin } or null
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
    currentUser = { id: sessionUser.id, name, picture, email: sessionUser.email || null, isAdmin: sessionUser.email === ADMIN_EMAIL };
  }

  client.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) ensureProfile(session.user).then(notifyAuth);
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) { currentUser = null; notifyAuth(); return; }
    if (event === 'TOKEN_REFRESHED') return;
    ensureProfile(session.user).then(notifyAuth);
  });

  // A phone browser tab that's been backgrounded for a while can come back
  // with a session whose refresh token silently failed — re-check as soon as
  // the tab is foregrounded again so a dead session surfaces as "signed out"
  // right away instead of only on the next failed save.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !currentUser) return;
    client.auth.getSession().then(({ data: { session } }) => {
      if (!session) { currentUser = null; notifyAuth(); }
    });
  });

  window.SB = {
    // ---- auth ----
    onAuthChange: (fn) => { authListeners.push(fn); if (currentUser !== undefined) fn(currentUser); },
    getUser: () => currentUser,
    isAdmin: () => !!currentUser?.isAdmin,
    // owner of the row, or the admin account, may edit/delete it
    canEdit: (row) => !!currentUser && (currentUser.isAdmin || (row && row.author_id === currentUser.id)),
    signInWithGoogle: () => client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    signOut: () => client.auth.signOut(),
    updateProfile: (patch) => {
      if (!currentUser) return Promise.reject(new Error('not signed in'));
      return rest(`shapeless_profiles?id=eq.${currentUser.id}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' });
    },
    getProfile: async (id) => {
      const rows = await rest(`shapeless_profiles?id=eq.${id}&select=*`);
      return (rows && rows[0]) || null;
    },
    listActivityOptOuts: () => rest('shapeless_profiles?hide_activity_from_feed=eq.true&select=id'),

    // ---- media uploads (comments: photos, audio) ----
    uploadMedia: async (file, onProgress) => {
      const { data: { session } } = await client.auth.getSession();
      if (!session && currentUser) { currentUser = null; notifyAuth(); throw new Error('signed out — please sign in again'); }
      const token = session?.access_token || KEY;
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${currentUser?.id || 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      // supabase-js's storage upload() wraps fetch(), which has no upload-progress
      // event — a big file (post-compression, still tens of MB) sat on a static
      // percentage the whole time it was actually uploading, reading as "stuck".
      // XHR gives us real byte-level progress via upload.onprogress.
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${URL}/storage/v1/object/voyage-media/${path}`);
        xhr.setRequestHeader('apikey', KEY);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.upload.onprogress = (e) => {
          if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
        };
        xhr.onload = () => { xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`${xhr.status} ${xhr.responseText}`)); };
        xhr.onerror = () => reject(new Error('network error during upload'));
        xhr.send(file);
      });
      const { data } = client.storage.from('voyage-media').getPublicUrl(path);
      const kind = file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file';
      return { url: data.publicUrl, kind, name: file.name };
    },

    // ---- seeds ----
    listSeeds: () => rest('shapeless_seeds?select=*&order=created_at.asc'),
    insertSeed: (row) => rest('shapeless_seeds', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    updateSeed: (id, patch) => rest(`shapeless_seeds?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    deleteSeed: (id) => rest(`shapeless_seeds?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    bulkInsertSeeds: (rows) => rest('shapeless_seeds', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- voyages ----
    listVoyages: () => rest('shapeless_voyages?select=*&order=created_at.desc'),
    insertVoyage: (row) => rest('shapeless_voyages', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    updateVoyage: (id, patch) => rest(`shapeless_voyages?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    deleteVoyage: (id) => rest(`shapeless_voyages?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    bulkInsertVoyages: (rows) => rest('shapeless_voyages', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- messages ----
    listMessages: () => rest('shapeless_messages?select=*&order=created_at.asc'),
    insertMessage: (row) => rest('shapeless_messages', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),
    deleteMessage: (id) => rest(`shapeless_messages?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    bulkInsertMessages: (rows) => rest('shapeless_messages', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- contact form (About Us) — insert-only, no read-back over the anon key ----
    sendContactMessage: (row) => rest('shapeless_contact_messages', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),

    // ---- retreat rsvps ----
    listRsvpCounts: async () => {
      const rows = await rest('shapeless_retreat_rsvps?select=date_iso');
      const counts = {};
      (rows || []).forEach(r => { counts[r.date_iso] = (counts[r.date_iso] || 0) + 1; });
      return counts;
    },
    insertRsvp: (dateIso) => rest('shapeless_retreat_rsvps', { method: 'POST', body: JSON.stringify([{ date_iso: dateIso, name: currentUser?.name || 'You', author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),

    // ---- retreats (real dates, replaces the old hardcoded demo calendar) ----
    listRetreats: () => rest('shapeless_retreats?select=*&order=date_iso.asc'),
    insertRetreat: (row) => rest('shapeless_retreats', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    updateRetreat: (id, patch) => rest(`shapeless_retreats?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    deleteRetreat: (id) => rest(`shapeless_retreats?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),

    // ---- join submissions ----
    insertJoinSubmission: (row) => rest('shapeless_join_submissions', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    listDirectory: () => rest('shapeless_join_submissions?listed=eq.true&select=*&order=created_at.desc'),

    // ---- page content (in-place editor) ----
    listPageContent: () => rest('shapeless_page_content?select=*'),
    upsertPageContent: (rows) => rest('shapeless_page_content?on_conflict=key', { method: 'POST', body: JSON.stringify(rows.map(r => ({ ...r, updated_by: currentUser?.id || null }))), prefer: 'resolution=merge-duplicates,return=minimal' }),

    // ---- box layout (resize/reorder in the in-place editor) ----
    listBoxLayout: () => rest('shapeless_box_layout?select=*'),
    upsertBoxLayout: (rows) => rest('shapeless_box_layout?on_conflict=key', { method: 'POST', body: JSON.stringify(rows.map(r => ({ ...r, updated_by: currentUser?.id || null }))), prefer: 'resolution=merge-duplicates,return=minimal' }),

    // ---- roadmap ----
    listRoadmap: () => rest('shapeless_roadmap_items?select=*&order=sort_order.asc'),
    insertRoadmapItem: (row) => rest('shapeless_roadmap_items', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null }]) }),
    deleteRoadmapItem: (id) => rest(`shapeless_roadmap_items?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    bulkInsertRoadmap: (rows) => rest('shapeless_roadmap_items', { method: 'POST', body: JSON.stringify(rows), prefer: 'return=minimal' }),

    // ---- feed (Home) ----
    listFeedPosts: () => rest('shapeless_feed_posts?select=*&order=created_at.desc'),
    insertFeedPost: (row) => rest('shapeless_feed_posts', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null, author_name: currentUser?.name || null, author_picture: currentUser?.picture || null }]) }),
    updateFeedPost: (id, patch) => rest(`shapeless_feed_posts?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    deleteFeedPost: (id) => rest(`shapeless_feed_posts?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    listFeedPostLikes: () => rest('shapeless_feed_post_likes?select=post_id,author_id'),
    likeFeedPost: (postId) => rest('shapeless_feed_post_likes', { method: 'POST', body: JSON.stringify([{ post_id: postId, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),
    unlikeFeedPost: (postId) => rest(`shapeless_feed_post_likes?post_id=eq.${encodeURIComponent(postId)}&author_id=eq.${currentUser?.id || ''}`, { method: 'DELETE', prefer: 'return=minimal' }),

    listFeedComments: () => rest('shapeless_feed_post_comments?select=*&order=created_at.asc'),
    addFeedComment: (postId, text) => rest('shapeless_feed_post_comments', { method: 'POST', body: JSON.stringify([{ post_id: postId, text, author_id: currentUser?.id || null, author_name: currentUser?.name || null, author_picture: currentUser?.picture || null }]) }),
    deleteFeedComment: (id) => rest(`shapeless_feed_post_comments?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    listFeedCommentLikes: () => rest('shapeless_feed_comment_likes?select=comment_id,author_id'),
    likeFeedComment: (commentId) => rest('shapeless_feed_comment_likes', { method: 'POST', body: JSON.stringify([{ comment_id: commentId, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),
    unlikeFeedComment: (commentId) => rest(`shapeless_feed_comment_likes?comment_id=eq.${encodeURIComponent(commentId)}&author_id=eq.${currentUser?.id || ''}`, { method: 'DELETE', prefer: 'return=minimal' }),

    // ---- community apps (Resources → Apps) ----
    listApps: () => rest('shapeless_apps?select=*&order=created_at.desc'),
    insertApp: (row) => rest('shapeless_apps', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null, author_name: currentUser?.name || null }]) }),
    updateApp: (id, patch) => rest(`shapeless_apps?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }),
    deleteApp: (id) => rest(`shapeless_apps?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
    listAppLikes: () => rest('shapeless_app_likes?select=app_id,author_id'),
    likeApp: (appId) => rest('shapeless_app_likes', { method: 'POST', body: JSON.stringify([{ app_id: appId, author_id: currentUser?.id || null }]), prefer: 'return=minimal' }),
    unlikeApp: (appId) => rest(`shapeless_app_likes?app_id=eq.${encodeURIComponent(appId)}&author_id=eq.${currentUser?.id || ''}`, { method: 'DELETE', prefer: 'return=minimal' }),
    listAppReviews: (appId) => rest(`shapeless_app_reviews?app_id=eq.${encodeURIComponent(appId)}&select=*&order=created_at.desc`),
    addAppReview: (row) => rest('shapeless_app_reviews', { method: 'POST', body: JSON.stringify([{ ...row, author_id: currentUser?.id || null, author_name: currentUser?.name || 'Someone' }]) }),
    deleteAppReview: (id) => rest(`shapeless_app_reviews?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),

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

    // ---- live jam signaling (WebRTC offer/answer/ICE relayed via Supabase Realtime broadcast, plus presence) ----
    joinJamRoom: (voyageId, { onSignal, onPresence } = {}) => {
      const myKey = currentUser?.id || ('anon-' + Math.random().toString(36).slice(2, 10));
      const channel = client.channel('jam-' + voyageId, {
        config: { broadcast: { self: false }, presence: { key: myKey } },
      });
      if (onSignal) channel.on('broadcast', { event: 'signal' }, (msg) => onSignal(msg.payload));
      if (onPresence) channel.on('presence', { event: 'sync' }, () => onPresence(channel.presenceState()));
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: currentUser?.name || 'Someone', joined_at: Date.now() });
        }
      });
      return {
        myId: myKey,
        send: (payload) => channel.send({ type: 'broadcast', event: 'signal', payload }),
        leave: () => client.removeChannel(channel),
      };
    },
  };
})();

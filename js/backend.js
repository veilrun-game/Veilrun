/* VEILRUN — backend bridge. Activates when config.js has Supabase keys; otherwise no-op (local only). */
(function () {
  const cfg = window.VEILRUN_CONFIG || {};
  const ready = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase;
  if (!ready) { window.VBackend = null; return; }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const who = () => localStorage.getItem("vr_who") || "anon";

  window.VBackend = {
    async submitFeedback(context, note, type) {
      try { await sb.from("feedback").insert({ who: who(), context, note, type: type || null }); } catch (e) { console.warn(e); }
    },
    async toggleLike(src) {
      try {
        const w = who();
        const { data } = await sb.from("image_likes").select("id").eq("who", w).eq("image_src", src).limit(1);
        if (data && data.length) await sb.from("image_likes").delete().eq("who", w).eq("image_src", src);
        else await sb.from("image_likes").insert({ who: w, image_src: src });
      } catch (e) { console.warn(e); }
    },
    async react(target, emoji) {
      try { await sb.from("reactions").insert({ who: who(), target, emoji }); } catch (e) { console.warn(e); }
    },
    async vote(poll, choice) {
      try { await sb.from("votes").insert({ who: who(), poll, choice }); } catch (e) { console.warn(e); }
    },
    // Toggle a single up-vote per person per poll (used by the Lab).
    async toggleVote(poll) {
      try {
        const w = who();
        const { data } = await sb.from("votes").select("poll").eq("who", w).eq("poll", poll).limit(1);
        if (data && data.length) await sb.from("votes").delete().eq("who", w).eq("poll", poll);
        else await sb.from("votes").insert({ who: w, poll, choice: "up" });
      } catch (e) { console.warn(e); }
    },
    async loadVotes() {
      try { const { data } = await sb.from("votes").select("who,poll"); return data || []; }
      catch (e) { return []; }
    },
    // Feedback rows (who + when) — powers the contribution leaderboard.
    async loadFeedback() {
      try { const { data } = await sb.from("feedback").select("who,created_at"); return data || []; }
      catch (e) { return []; }
    },
    // Full feedback rows (id, context, note, type, who, created_at) — powers per-section idea lists (Threats, etc).
    async loadFeedbackFull() {
      try {
        const { data } = await sb.from("feedback").select("id,who,context,note,type,created_at").eq("resolved", false);
        return data || [];
      } catch (e) { return []; }
    },
    async signOut() { try { await sb.auth.signOut(); } catch (e) {} },
    // Persist a chosen display name to the account so it survives across devices/sessions.
    async updateDisplayName(name) { try { await sb.auth.updateUser({ data: { display_name: name } }); } catch (e) {} },
    // All like rows [{who, image_src}] — used to hydrate the UI (mine + group counts).
    async loadLikes() {
      try { const { data } = await sb.from("image_likes").select("who,image_src"); return data || []; }
      catch (e) { return []; }
    }
  };
  console.info("VEILRUN backend connected.");
})();

/* VEILRUN — backend bridge. Activates when config.js has Supabase keys; otherwise no-op (local only). */
(function () {
  const cfg = window.VEILRUN_CONFIG || {};
  const ready = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase;
  if (!ready) { window.VBackend = null; return; }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const who = () => localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || "anon";

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
    // `choice` defaults to "up", so every pre-VR-99 caller (the Lab, counter-concepts,
    // the per-section idea lists) keeps its exact old behaviour: vote, vote again, gone.
    // The Loom passes "down" as well — same row, same table, NO NEW SQL. The three cases
    // are deliberate: same choice again un-votes, the other choice FLIPS the existing row
    // rather than stacking a second one, and nothing there inserts.
    async toggleVote(poll, choice) {
      const ch = choice === "down" ? "down" : "up";
      try {
        const w = who();
        const { data } = await sb.from("votes").select("poll,choice").eq("who", w).eq("poll", poll).limit(1);
        if (data && data.length) {
          if ((data[0].choice || "up") === ch) await sb.from("votes").delete().eq("who", w).eq("poll", poll);
          else await sb.from("votes").update({ choice: ch }).eq("who", w).eq("poll", poll);
        } else await sb.from("votes").insert({ who: w, poll, choice: ch });
      } catch (e) { console.warn(e); }
    },
    // `choice` is selected because the Loom nets up against down. Rows written before
    // VR-99 may carry null here; every reader treats null as "up".
    async loadVotes() {
      try { const { data } = await sb.from("votes").select("who,poll,choice,created_at"); return data || []; }
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
    // Feedback that's since been acted on — powers "you asked, we listened" on Updates + the Feedback page.
    async loadResolvedFeedback(limit) {
      try {
        const { data } = await sb.from("feedback").select("who,context,note,type,resolved_at")
          .eq("resolved", true).order("resolved_at", { ascending: false }).limit(limit || 500);
        return data || [];
      } catch (e) { return []; }
    },
    // Counts + average turnaround for the Feedback page header stats.
    async loadFeedbackStats() {
      try {
        const { data } = await sb.from("feedback").select("id,resolved,created_at,resolved_at");
        const rows = data || [];
        const resolvedRows = rows.filter(r => r.resolved);
        const turns = resolvedRows
          .map(r => r.resolved_at && r.created_at ? (new Date(r.resolved_at) - new Date(r.created_at)) / 864e5 : null)
          .filter(v => v != null && v >= 0);
        return {
          total: rows.length,
          resolved: resolvedRows.length,
          open: rows.length - resolvedRows.length,
          avgDays: turns.length ? turns.reduce((a, b) => a + b, 0) / turns.length : null
        };
      } catch (e) { return { total: 0, resolved: 0, open: 0, avgDays: null }; }
    },
    /* ---- Game reference (VR-98) ------------------------------------------
       Every one of these fails quietly to an empty result if the tables aren't
       there yet — same contract as image_order and logins, so the page renders
       as "nothing submitted" rather than breaking the site. */
    async loadGameRefs() {
      try { const { data } = await sb.from("game_refs").select("slug,name,who,created_at"); return data || []; }
      catch (e) { return []; }
    },
    async loadGameRefNotes() {
      try {
        const { data } = await sb.from("game_ref_notes")
          .select("slug,who,loves,gripes,tags,gripe_tags,raw_name,match_kind,created_at,updated_at");
        return data || [];
      } catch (e) { return []; }
    },
    // First submission of a game. Ignores a duplicate-slug race — if two people add the
    // same game at once, the loser's insert fails and their NOTE still lands, which is
    // exactly the intended outcome.
    async createGameRef(slug, name, who) {
      try { await sb.from("game_refs").insert({ slug, name, who }); return true; }
      catch (e) { console.warn(e); return false; }
    },
    // One take per person per game. `unique (slug, who)` in Postgres makes this an
    // upsert rather than a decision: submitting again edits what you already said.
    async upsertGameRefNote(note) {
      try {
        const { error } = await sb.from("game_ref_notes").upsert({
          slug: note.slug, who: note.who,
          loves: note.loves || null, gripes: note.gripes || null,
          tags: note.tags || [], gripe_tags: note.gripeTags || [],
          raw_name: note.rawName || null, match_kind: note.matchKind || null,
          updated_at: new Date().toISOString()
        }, { onConflict: "slug,who" });
        if (error) throw error;
        return { ok: true };
      } catch (e) {
        console.warn(e);
        return { ok: false, message: (e && e.message) || "Couldn't save that — try again." };
      }
    },
    async signOut() { try { await sb.auth.signOut(); } catch (e) {} },
    // Persist a chosen display name to the account so it survives across devices/sessions.
    async updateDisplayName(name) { try { await sb.auth.updateUser({ data: { display_name: name } }); } catch (e) {} },
    // All like rows [{who, image_src}] — used to hydrate the UI (mine + group counts).
    // Best-time scores for a playable prototype — powers the leaderboard surfaced in the Lab.
    async loadGameScores(gameId) {
      try { const { data } = await sb.from("game_scores").select("who,time_ms").eq("game_id", gameId); return data || []; }
      catch (e) { return []; }
    },
    // Point-earning game events (try / clear / beat-best / record) — folded into the contribution leaderboard.
    async loadGamePoints() {
      try { const { data } = await sb.from("game_points").select("who,points,created_at"); return data || []; }
      catch (e) { return []; }
    },
    async loadLikes() {
      try { const { data } = await sb.from("image_likes").select("who,image_src,created_at"); return data || []; }
      catch (e) { return []; }
    },
    // Saved per-character image order — shared/group-wide, not per-browser. No-ops quietly if the
    // image_order table hasn't been created yet (see VEILRUN Backend Setup.md for the SQL).
    async loadImageOrder() {
      try { const { data } = await sb.from("image_order").select("char_id,order_json"); return data || []; }
      catch (e) { return []; }
    },
    // order_json now stores { order, hidden }. Legacy rows are a bare array (order only) — handled on load.
    async saveImageOrder(charId, order, hidden) {
      try {
        await sb.from("image_order").upsert({ char_id: charId, order_json: { order: order, hidden: hidden || [] }, updated_by: who(), updated_at: new Date().toISOString() });
        return true;
      } catch (e) { console.warn(e); return false; }
    },
    // One row per session for a signed-in account — powers the "logins" stat on the profile page.
    async logLogin() {
      try { await sb.from("logins").insert({ who: who() }); } catch (e) { console.warn(e); }
    },
    async loadLogins() {
      try { const { data } = await sb.from("logins").select("who,created_at"); return data || []; }
      catch (e) { return []; }
    },
    // Only meaningful for email/password accounts — Google accounts don't set a Veilrun password.
    async updatePassword(newPassword) {
      try {
        const { error } = await sb.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return { ok: true };
      } catch (e) { return { ok: false, message: (e && e.message) || "Couldn't update password." }; }
    }
  };
  console.info("VEILRUN backend connected.");
})();

window.Platformer = window.Platformer || {};

Platformer.Updater = {
  resolveSource() {
    const cfg = Platformer.Settings.current.updates || {};
    const defaultRepo = "zyynx-hub/Platformer";
    const buildRepo = String(Platformer.BUILD_UPDATE_REPO || "").trim().replace(/^\/+|\/+$/g, "");
    const buildChannel = String(Platformer.BUILD_UPDATE_CHANNEL || "stable").trim() || "stable";
    const buildEnabled = Platformer.BUILD_UPDATE_ENABLED !== false;
    const repo = buildRepo || defaultRepo;
    return {
      enabled: buildEnabled && cfg.enabled !== false,
      kind: "github",
      repo,
      channel: buildChannel,
      currentVersion: cfg.currentVersion || "0.0.0",
      fallbackDownloadUrl: cfg.downloadUrl || "",
    };
  },

  friendlyError(message) {
    const raw = String(message || "").toLowerCase();
    if (!raw) return "Update check failed.";
    if (raw.includes("no public release")) {
      return "No public release found yet.";
    }
    if (raw.includes("winerror 87") || raw.includes("parameter is incorrect")) {
      return "Network/proxy config issue. Retry or disable proxy/VPN.";
    }
    if (raw.includes("timed out") || raw.includes("network") || raw.includes("offline") || raw.includes("failed to fetch")) {
      return "Offline, retrying later.";
    }
    if (raw.includes("rate limit") || raw.includes("403")) {
      return "Update server busy, try later.";
    }
    if (raw.includes("404")) {
      return "No public release found yet.";
    }
    return "Can't reach update server.";
  },

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  compareVersions(a, b) {
    const norm = (v) => String(v || "0")
      .split(".")
      .map((p) => parseInt(p, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));

    const aa = norm(a);
    const bb = norm(b);
    const len = Math.max(aa.length, bb.length);
    for (let i = 0; i < len; i += 1) {
      const av = aa[i] || 0;
      const bv = bb[i] || 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  },

  async check() {
    const source = this.resolveSource();
    if (!source.enabled) {
      return { ok: true, enabled: false, message: "Auto updates are off." };
    }

    if (source.kind === "github" && window.pywebview && window.pywebview.api) {
      if (typeof window.pywebview.api.check_update_github !== "function") {
        return { ok: false, enabled: true, transient: true, message: "Update bridge not ready yet." };
      }
      try {
        const res = await window.pywebview.api.check_update_github(
          source.repo,
          source.currentVersion,
          source.channel,
        );
        if (res && res.ok) {
          const hasUpdate = !!res.hasUpdate;
          const downloadUrl = res.downloadUrl || source.fallbackDownloadUrl || "";
          if (hasUpdate && !downloadUrl) {
            return {
              ok: false,
              enabled: true,
              transient: true,
              latestVersion: res.latestVersion || source.currentVersion,
              releaseNotes: res.releaseNotes || "",
              releasePublishedAt: res.releasePublishedAt || "",
              message: "Update found, but package is not published yet. Retry in a moment.",
            };
          }
          return {
            ok: true,
            enabled: true,
            hasUpdate,
            latestVersion: res.latestVersion || source.currentVersion,
            downloadUrl,
            checksumSha256: res.checksumSha256 || "",
            releaseNotes: res.releaseNotes || "",
            releasePublishedAt: res.releasePublishedAt || "",
            message: res.message || (hasUpdate ? "Update found." : "You're up to date."),
          };
        }
        return {
          ok: false,
          enabled: true,
          message: this.friendlyError((res && res.message) || "Can't reach update server."),
        };
      } catch (e) {
        return { ok: false, enabled: true, message: this.friendlyError(e && e.message ? e.message : e) };
      }
    }

    return { ok: false, enabled: true, message: "Update service not ready in this runtime." };
  },

  openDownload(url) {
    if (!url) return false;
    if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.open_url === "function") {
      window.pywebview.api.open_url(url);
      return true;
    }
    try {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    } catch (_e) {
      return false;
    }
  },

  canInAppApply() {
    return !!(
      window.pywebview
      && window.pywebview.api
      && typeof window.pywebview.api.start_update_download === "function"
      && typeof window.pywebview.api.get_update_progress === "function"
      && typeof window.pywebview.api.apply_downloaded_update === "function"
    );
  },

  async updateAndRestart(downloadUrl, onProgress) {
    if (!this.canInAppApply()) {
      return { ok: false, message: "In-app updater API unavailable." };
    }
    if (!downloadUrl) {
      return { ok: false, message: "Update package URL missing." };
    }

    const sendProgress = (payload) => {
      if (typeof onProgress === "function") onProgress(payload);
    };

    try {
      if (Platformer.Debug) Platformer.Debug.log("Updater", `Starting in-app update: ${downloadUrl}`);
      const start = await window.pywebview.api.start_update_download(
        downloadUrl,
        Platformer.Updater.latestChecksumSha256 || "",
      );
      if (!start || !start.ok) {
        const msg = (start && start.message) || "Failed to start update download.";
        if (Platformer.Debug) Platformer.Debug.error("Updater", msg);
        return { ok: false, message: msg };
      }

      sendProgress({ stage: "downloading", progress: 0, message: "Downloading update..." });

      for (let i = 0; i < 1200; i += 1) {
        const status = await window.pywebview.api.get_update_progress();
        if (!status || !status.ok) {
          const msg = (status && status.message) || "Failed to read update progress.";
          if (Platformer.Debug) Platformer.Debug.error("Updater", msg);
          return { ok: false, message: msg };
        }

        sendProgress(status);

        if (status.stage === "error") {
          const msg = status.message || "Update download failed.";
          if (Platformer.Debug) Platformer.Debug.error("Updater", msg);
          return { ok: false, message: msg };
        }
        if (status.stage === "downloaded") {
          break;
        }
        await this.wait(250);
      }

      sendProgress({ stage: "applying", progress: 100, message: "Restarting to finish update..." });
      if (Platformer.Debug) Platformer.Debug.log("Updater", "Download complete. Applying update.");
      const applied = await window.pywebview.api.apply_downloaded_update();
      if (!applied || !applied.ok) {
        const msg = (applied && applied.message) || "Failed to apply update.";
        if (Platformer.Debug) Platformer.Debug.error("Updater", msg);
        return { ok: false, message: msg };
      }

      if (Platformer.Debug) Platformer.Debug.log("Updater", "Updater helper launched; app is restarting.");
      return { ok: true, message: applied.message || "Restarting to finish update..." };
    } catch (e) {
      const msg = `Update flow failed: ${e && e.message ? e.message : e}`;
      if (Platformer.Debug) Platformer.Debug.error("Updater", msg);
      return { ok: false, message: msg };
    }
  },
};

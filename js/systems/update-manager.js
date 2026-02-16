window.Platformer = window.Platformer || {};

Platformer.UpdateManager = class {
  constructor(scene) {
    this.scene = scene;
    this.pendingUpdateUrl = "";
    this.updateInProgress = false;
    this.statusLockUntil = 0;
    // -1 means "no manual update click in this session yet".
    this.lastManualUpdateAt = -1;
    this.latestChecksumSha256 = "";
    this.autoCheckRetryCount = 0;
    this.autoCheckStartedAt = 0;
  }

  log(level, msg) {
    if (!Platformer.Debug) return;
    if (level === "error") Platformer.Debug.error("UpdateManager", msg);
    else if (level === "warn") Platformer.Debug.warn("UpdateManager", msg);
    else Platformer.Debug.log("UpdateManager", msg);
  }

  now() {
    return this.scene && this.scene.time ? this.scene.time.now : Date.now();
  }

  syncSceneState() {
    this.scene.pendingUpdateUrl = this.pendingUpdateUrl;
    this.scene.updateInProgress = this.updateInProgress;
    this.scene.updateStatusLockUntil = this.statusLockUntil;
    this.scene.lastManualUpdateAt = this.lastManualUpdateAt;
  }

  setStatus(text, sticky = false, ms = 8000) {
    const scene = this.scene;
    if (!scene || !scene.sys || !scene.sys.settings || !scene.sys.settings.active) return;
    const now = this.now();
    if (!sticky && now < this.statusLockUntil) return;
    if (sticky) this.statusLockUntil = now + Math.max(500, ms);
    scene.setBottomLeftUpdateStatus(text, sticky);
    this.syncSceneState();
  }

  resetAutoCheckRetry() {
    this.autoCheckRetryCount = 0;
    this.autoCheckStartedAt = 0;
  }

  setButtonText(text) {
    const scene = this.scene;
    if (!scene || !scene.updateButtonText) return;
    scene.safeSetText(scene.updateButtonText, text, "updateButtonText");
  }

  async startInAppUpdate(downloadUrl, startMessage = "Preparing update...") {
    const scene = this.scene;
    this.updateInProgress = true;
    this.statusLockUntil = this.now() + 30000;
    this.syncSceneState();

    if (scene.updateButton) scene.updateButton.disableInteractive();
    this.setButtonText("Updating...");
    this.setStatus(startMessage, true, 30000);
    this.log("info", `startInAppUpdate: ${startMessage}`);

    const result = await Platformer.Updater.updateAndRestart(downloadUrl, (status) => {
      const pct = Number(status.progress || 0);
      const msg = status.message || status.stage || "Updating...";
      const compact = status.stage === "downloading" && Number.isFinite(pct)
        ? `${msg} (${pct.toFixed(1)}%)`
        : msg;
      this.setStatus(compact, true, 15000);
    });

    if (!result.ok) {
      this.updateInProgress = false;
      this.statusLockUntil = this.now() + 15000;
      this.syncSceneState();
      if (scene.updateButton) scene.updateButton.setInteractive({ useHandCursor: true });
      this.setButtonText("Update + Restart");
      this.setStatus(result.message || "Update failed.", true, 15000);
      this.log("error", `startInAppUpdate failed: ${result.message || "unknown"}`);
      return { ok: false, message: result.message || "Update failed." };
    }

    this.setStatus(result.message || "Restarting to finish update...", true, 30000);
    this.log("info", "startInAppUpdate succeeded; helper should relaunch app.");
    return { ok: true, message: result.message || "Restarting to finish update..." };
  }

  async handleUpdateClick() {
    const scene = this.scene;
    this.lastManualUpdateAt = this.now();
    this.statusLockUntil = this.now() + 12000;
    this.syncSceneState();

    this.log("info", "Update button clicked.");
    if (this.updateInProgress) {
      this.log("warn", "Ignored click: update already in progress.");
      this.setStatus("Update already in progress...", true, 10000);
      return;
    }

    if (this.pendingUpdateUrl) {
      if (Platformer.Updater.canInAppApply()) {
        const result = await this.startInAppUpdate(this.pendingUpdateUrl, "Updating game...");
        if (!result.ok) this.log("error", result.message || "Update failed.");
        return;
      }
      this.log("info", `In-app updater unavailable; opening URL: ${this.pendingUpdateUrl}`);
      const opened = Platformer.Updater.openDownload(this.pendingUpdateUrl);
      this.setStatus(opened ? "Downloading update..." : "Update download failed", true, 12000);
      return;
    }

    this.setStatus("Checking for updates...", true, 12000);
    this.log("info", "Manual update check requested.");
    let result;
    try {
      result = await Platformer.Updater.check();
    } catch (err) {
      this.log("error", `autoCheck failed: ${err && err.message ? err.message : err}`);
      this.setStatus("Update check failed. Press Update.", true, 10000);
      this.resetAutoCheckRetry();
      return;
    }
    if (!result) {
      this.log("warn", "autoCheck returned empty result.");
      this.setStatus("Update check failed. Press Update.", true, 10000);
      this.resetAutoCheckRetry();
      return;
    }
    if (!result.ok) {
      this.log("warn", `Check failed: ${result.message || "unknown"}`);
      this.setStatus(result.message || "Can't reach update server.", true, 12000);
      return;
    }

    if (scene.setLatestChangesFromResult) scene.setLatestChangesFromResult(result);
    if (!result.enabled) {
      this.setStatus("Auto updates are off.", true, 12000);
      return;
    }

    if (result.hasUpdate) {
      this.pendingUpdateUrl = result.downloadUrl || "";
      this.latestChecksumSha256 = result.checksumSha256 || "";
      Platformer.Updater.latestChecksumSha256 = this.latestChecksumSha256;
      this.syncSceneState();

      if (!this.pendingUpdateUrl) {
        this.setButtonText("Update");
        this.setStatus("Update found, package not ready yet. Retry soon.", true, 12000);
        this.log("warn", `Update ${result.latestVersion || "(unknown)"} available without download URL.`);
        return;
      }

      const v = result.latestVersion ? `v${result.latestVersion}` : "new";
      this.setButtonText("Update + Restart");
      this.setStatus(`Update found (${v}). Starting now...`, true, 12000);
      this.log("warn", `Update available: ${v}`);

      if (Platformer.Updater.canInAppApply()) {
        const autoStart = await this.startInAppUpdate(this.pendingUpdateUrl, "Updating game...");
        if (!autoStart.ok) this.log("error", autoStart.message || "Update failed.");
      }
      return;
    }

    this.pendingUpdateUrl = "";
    this.latestChecksumSha256 = "";
    Platformer.Updater.latestChecksumSha256 = "";
    this.syncSceneState();
    this.setButtonText("Update");
    this.setStatus("You're up to date.", true, 8000);
    this.log("info", "No update available.");
  }

  async autoCheck() {
    const scene = this.scene;
    if (!scene || !scene.sys || !scene.sys.settings || !scene.sys.settings.active) return;
    if (this.updateInProgress) return;
    if (this.lastManualUpdateAt >= 0 && (this.now() - this.lastManualUpdateAt < 10000)) {
      this.log("info", "Auto-check skipped: recent manual update action.");
      return;
    }

    const cfg = Platformer.Settings.current.updates || {};
    if (!cfg.enabled) {
      this.setStatus("Auto updates are off.");
      return;
    }

    if (this.autoCheckRetryCount === 0) {
      this.autoCheckStartedAt = this.now();
    }
    this.setStatus("Checking for updates...");
    const result = await Platformer.Updater.check();
    if (!scene.sys || !scene.sys.settings || !scene.sys.settings.active) return;
    if (!scene.scene || !scene.scene.isActive || !scene.scene.isActive("MenuScene")) return;

    if (!result.ok) {
      if (result.transient) {
        this.autoCheckRetryCount += 1;
        const elapsed = this.now() - (this.autoCheckStartedAt || this.now());
        this.log("warn", `Transient check state #${this.autoCheckRetryCount}: ${result.message || "pending"}`);
        // Avoid infinite "Checking..." loops when bridge/service never becomes ready.
        if (this.autoCheckRetryCount >= 8 || elapsed > 15000) {
          this.setStatus("Update service not ready. Press Update.", true, 10000);
          this.resetAutoCheckRetry();
          return;
        }
        this.setStatus("Checking for updates...");
        if (scene.time && scene.sys && scene.sys.settings && scene.sys.settings.active) {
          const retryDelay = Math.min(2400, 800 + this.autoCheckRetryCount * 200);
          scene.time.delayedCall(retryDelay, () => this.autoCheck());
        }
        return;
      }
      this.resetAutoCheckRetry();
      this.setStatus(result.message || "Can't reach update server.");
      return;
    }
    this.resetAutoCheckRetry();
    if (!result.enabled) {
      this.setStatus("Auto updates are off.");
      return;
    }

    if (scene.setLatestChangesFromResult) scene.setLatestChangesFromResult(result);
    if (result.hasUpdate) {
      const v = result.latestVersion ? `v${result.latestVersion}` : "new version";
      this.pendingUpdateUrl = result.downloadUrl || "";
      this.latestChecksumSha256 = result.checksumSha256 || "";
      Platformer.Updater.latestChecksumSha256 = this.latestChecksumSha256;
      this.syncSceneState();
      if (!this.pendingUpdateUrl) {
        this.setButtonText("Update");
        this.setStatus("Update found, package not ready yet. Retry soon.");
        this.log("warn", `Auto-check found update ${result.latestVersion || "(unknown)"} without download URL.`);
        return;
      }
      this.setButtonText("Update + Restart");
      this.setStatus(`Update found (${v}). Press Update.`);
    } else {
      this.pendingUpdateUrl = "";
      this.latestChecksumSha256 = "";
      Platformer.Updater.latestChecksumSha256 = "";
      this.syncSceneState();
      this.setButtonText("Update");
      this.setStatus("You're up to date.");
    }
  }
};

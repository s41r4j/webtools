(() => {
    "use strict";

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    if (!mobileQuery.matches) return;

    const video = document.getElementById("webcam-video");
    const stage = document.getElementById("webcam-stage");
    const permission = document.getElementById("webcam-permission");
    const permissionTitle = document.getElementById("webcam-permission-title");
    const permissionMessage = document.getElementById("webcam-permission-message");
    const enableButton = document.getElementById("webcam-enable-button");
    const captureButton = document.getElementById("webcam-capture-button");
    const settings = document.getElementById("webcam-settings");
    const settingsButton = document.getElementById("webcam-settings-button");
    const galleryButton = document.getElementById("webcam-gallery-button");
    const galleryPanel = document.getElementById("webcam-gallery-panel");
    const galleryClose = document.getElementById("webcam-gallery-close");
    const galleryBackdrop = document.getElementById("webcam-gallery-backdrop");

    if (!video || !stage || !permission || !enableButton || !captureButton || !galleryPanel) return;

    function closeGallery() {
        galleryPanel.classList.remove("is-open");
        galleryPanel.setAttribute("aria-hidden", "true");
        galleryBackdrop?.classList.remove("is-open");
        galleryBackdrop?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("webcam-gallery-open");
    }

    function closeSettings() {
        if (!settings) return;
        settings.hidden = true;
        settingsButton?.classList.remove("is-active");
        settingsButton?.setAttribute("aria-expanded", "false");
        document.body.classList.remove("webcam-settings-open");
    }

    function showPermissionPrompt(title, message) {
        permissionTitle.textContent = title;
        permissionMessage.textContent = message;
        permission.classList.remove("is-hidden");
        captureButton.disabled = true;
    }

    async function resumeVideo() {
        if (!video.srcObject) return false;
        try {
            video.muted = true;
            video.setAttribute("playsinline", "");
            await video.play();
            captureButton.disabled = video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA;
            return true;
        } catch (error) {
            console.warn("Mobile camera resume failed:", error);
            return false;
        }
    }

    function verifyCameraState() {
        const activeTrack = video.srcObject?.getVideoTracks?.().find(track => track.readyState === "live");
        const ready = Boolean(activeTrack) && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

        if (ready) {
            permission.classList.add("is-hidden");
            captureButton.disabled = false;
            return;
        }

        showPermissionPrompt(
            "Tap to open the camera.",
            "Mobile browsers require a direct tap before camera playback can begin. Allow camera access when prompted."
        );
    }

    closeGallery();
    closeSettings();
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    galleryButton?.addEventListener("click", () => {
        closeSettings();
        galleryPanel.setAttribute("aria-hidden", "false");
        document.body.classList.add("webcam-gallery-open");
    }, true);

    galleryClose?.addEventListener("click", closeGallery, true);
    galleryBackdrop?.addEventListener("click", closeGallery, true);

    settingsButton?.addEventListener("click", () => {
        closeGallery();
        document.body.classList.toggle("webcam-settings-open", !settings?.hidden);
    }, true);

    enableButton.addEventListener("click", () => {
        closeGallery();
        closeSettings();
        setTimeout(async () => {
            await resumeVideo();
            verifyCameraState();
        }, 450);
    }, true);

    stage.addEventListener("touchend", () => {
        if (video.srcObject && video.paused) {
            resumeVideo();
        }
    }, { passive: true });

    video.addEventListener("loadeddata", verifyCameraState);
    video.addEventListener("playing", verifyCameraState);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            setTimeout(async () => {
                await resumeVideo();
                verifyCameraState();
            }, 150);
        }
    });

    window.addEventListener("pageshow", () => {
        setTimeout(async () => {
            await resumeVideo();
            verifyCameraState();
        }, 150);
    });

    setTimeout(verifyCameraState, 1200);
})();

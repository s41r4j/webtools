(() => {
    "use strict";

    const stage = document.getElementById("webcam-stage");
    const video = document.getElementById("webcam-video");
    const permission = document.getElementById("webcam-permission");
    const galleryPanel = document.getElementById("webcam-gallery-panel");
    const settingsPanel = document.getElementById("webcam-settings");
    const shortcuts = document.querySelector(".webcam-shortcuts");

    if (!stage || !video) return;

    const reticle = document.createElement("div");
    reticle.className = "webcam-focus-reticle";
    reticle.setAttribute("aria-hidden", "true");

    const hint = document.createElement("div");
    hint.className = "webcam-focus-hint";
    hint.setAttribute("aria-live", "polite");

    stage.append(reticle, hint);

    if (shortcuts && !shortcuts.querySelector('[data-focus-shortcut="true"]')) {
        const key = document.createElement("span");
        key.dataset.focusShortcut = "true";
        key.textContent = "Tap";
        const action = document.createElement("strong");
        action.textContent = "Focus";
        shortcuts.append(key, action);
    }

    let hideReticleTimer = null;
    let hideHintTimer = null;
    let focusRequestId = 0;

    function showHint(message, duration = 1700) {
        clearTimeout(hideHintTimer);
        hint.textContent = message;
        hint.classList.add("is-visible");
        hideHintTimer = window.setTimeout(() => hint.classList.remove("is-visible"), duration);
    }

    function showReticle(clientX, clientY, state = "is-focusing") {
        const rect = stage.getBoundingClientRect();
        const x = Math.max(12, Math.min(rect.width - 12, clientX - rect.left));
        const y = Math.max(12, Math.min(rect.height - 12, clientY - rect.top));

        clearTimeout(hideReticleTimer);
        reticle.style.left = `${x}px`;
        reticle.style.top = `${y}px`;
        reticle.className = `webcam-focus-reticle is-visible ${state}`;
    }

    function finishReticle(state, duration = 900) {
        reticle.className = `webcam-focus-reticle is-visible ${state}`;
        clearTimeout(hideReticleTimer);
        hideReticleTimer = window.setTimeout(() => {
            reticle.className = "webcam-focus-reticle";
        }, duration);
    }

    function getDigitalZoom() {
        const raw = getComputedStyle(stage).getPropertyValue("--webcam-zoom");
        return Math.max(1, Number.parseFloat(raw) || 1);
    }

    function getNormalizedFocusPoint(clientX, clientY) {
        const rect = stage.getBoundingClientRect();
        const sourceWidth = video.videoWidth || rect.width;
        const sourceHeight = video.videoHeight || rect.height;
        const zoom = getDigitalZoom();

        const coverScale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight);
        const displayedWidth = sourceWidth * coverScale * zoom;
        const displayedHeight = sourceHeight * coverScale * zoom;
        const offsetX = (rect.width - displayedWidth) / 2;
        const offsetY = (rect.height - displayedHeight) / 2;

        let x = ((clientX - rect.left) - offsetX) / displayedWidth;
        let y = ((clientY - rect.top) - offsetY) / displayedHeight;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        if (video.classList.contains("is-mirrored")) {
            x = 1 - x;
        }

        return { x, y };
    }

    function getLiveTrack() {
        return video.srcObject
            ?.getVideoTracks?.()
            .find((track) => track.readyState === "live") || null;
    }

    function canHandleFocus(event) {
        if (!event.isPrimary) return false;
        if (event.button !== undefined && event.button !== 0) return false;
        if (event.target.closest("button, select, input, .webcam-settings, .webcam-permission, .webcam-gallery-panel")) return false;
        if (!permission?.classList.contains("is-hidden")) return false;
        if (galleryPanel?.classList.contains("is-open")) return false;
        if (settingsPanel && !settingsPanel.hidden) return false;
        return true;
    }

    async function applyTapFocus(track, point) {
        const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
        const supported = navigator.mediaDevices?.getSupportedConstraints?.() || {};
        const focusModes = Array.isArray(capabilities.focusMode) ? capabilities.focusMode : [];

        const constraint = {};

        if (supported.pointsOfInterest) {
            constraint.pointsOfInterest = [point];
        }

        if (supported.focusMode && focusModes.includes("single-shot")) {
            constraint.focusMode = "single-shot";
        } else if (supported.focusMode && focusModes.includes("continuous")) {
            constraint.focusMode = "continuous";
        }

        if (supported.exposureMode && Array.isArray(capabilities.exposureMode)) {
            if (capabilities.exposureMode.includes("single-shot")) {
                constraint.exposureMode = "single-shot";
            } else if (capabilities.exposureMode.includes("continuous")) {
                constraint.exposureMode = "continuous";
            }
        }

        if (!Object.keys(constraint).length) {
            return false;
        }

        try {
            await track.applyConstraints({ advanced: [constraint] });
        } catch (advancedError) {
            await track.applyConstraints(constraint);
        }

        return true;
    }

    async function focusAt(event) {
        if (!canHandleFocus(event)) return;

        const track = getLiveTrack();
        if (!track) {
            showHint("Enable the camera first");
            return;
        }

        const requestId = ++focusRequestId;
        showReticle(event.clientX, event.clientY, "is-focusing");
        const point = getNormalizedFocusPoint(event.clientX, event.clientY);

        try {
            const focused = await applyTapFocus(track, point);
            if (requestId !== focusRequestId) return;

            if (focused) {
                finishReticle("is-locked");
                showHint("Focus locked");
            } else {
                finishReticle("is-unsupported", 1200);
                showHint("Tap focus is unavailable on this camera", 2200);
            }
        } catch (error) {
            console.warn("Tap-to-focus failed:", error);
            if (requestId !== focusRequestId) return;
            finishReticle("is-error", 1200);
            showHint("This browser could not change focus", 2200);
        }
    }

    stage.addEventListener("pointerup", focusAt);

    const previousDestroy = window.destroyWebcam;
    window.destroyWebcam = () => {
        clearTimeout(hideReticleTimer);
        clearTimeout(hideHintTimer);
        stage.removeEventListener("pointerup", focusAt);
        reticle.remove();
        hint.remove();
        if (typeof previousDestroy === "function") previousDestroy();
    };
})();

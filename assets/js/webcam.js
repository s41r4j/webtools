(() => {
    "use strict";

    if (typeof window.destroyWebcam === "function") {
        window.destroyWebcam();
    }

    const byId = (id) => document.getElementById(id);
    const el = {
        stage: byId("webcam-stage"),
        video: byId("webcam-video"),
        canvas: byId("webcam-canvas"),
        grid: byId("webcam-grid"),
        status: byId("webcam-status"),
        statusText: byId("webcam-status-text"),
        cameraSelect: byId("webcam-camera-select"),
        refreshButton: byId("webcam-refresh-button"),
        enableButton: byId("webcam-enable-button"),
        captureButton: byId("webcam-capture-button"),
        switchButton: byId("webcam-switch-button"),
        gridButton: byId("webcam-grid-button"),
        mirrorButton: byId("webcam-mirror-button"),
        timerButton: byId("webcam-timer-button"),
        timerLabel: byId("webcam-timer-label"),
        ratioButton: byId("webcam-ratio-button"),
        ratioLabel: byId("webcam-ratio-label"),
        settingsButton: byId("webcam-settings-button"),
        settingsClose: byId("webcam-settings-close"),
        settings: byId("webcam-settings"),
        settingsZoom: byId("webcam-settings-zoom"),
        filterStrip: byId("webcam-filter-strip"),
        zoomStrip: byId("webcam-zoom-strip"),
        galleryButton: byId("webcam-gallery-button"),
        galleryPanel: byId("webcam-gallery-panel"),
        galleryClose: byId("webcam-gallery-close"),
        galleryBackdrop: byId("webcam-gallery-backdrop"),
        gallery: byId("webcam-gallery"),
        photoCount: byId("webcam-photo-count"),
        downloadAll: byId("webcam-download-all"),
        deleteAll: byId("webcam-delete-all"),
        permission: byId("webcam-permission"),
        permissionTitle: byId("webcam-permission-title"),
        permissionMessage: byId("webcam-permission-message"),
        countdown: byId("webcam-countdown"),
        toast: byId("webcam-toast"),
        flash: byId("webcam-flash")
    };

    if (!el.stage || !el.video) return;

    const isMobile = window.matchMedia("(max-width: 760px)");
    const DB_NAME = "WebToolsCameraPhotos";
    const STORE_NAME = "photos";

    const FILTERS = {
        none: "none",
        vivid: "saturate(1.28) contrast(1.09)",
        warm: "sepia(0.15) saturate(1.16) hue-rotate(-7deg)",
        cool: "saturate(1.08) hue-rotate(9deg) brightness(1.02)",
        mono: "grayscale(1) contrast(1.12)"
    };

    const RATIOS = [
        { label: "4:3", key: "4:3", value: 4 / 3 },
        { label: "1:1", key: "1:1", value: 1 },
        { label: "16:9", key: "16:9", value: 16 / 9 },
        { label: "Full", key: "full", value: null }
    ];

    let databasePromise = null;
    let stream = null;
    let devices = [];
    let activeDeviceId = "";
    let facingMode = "user";
    let gridEnabled = false;
    let mirrored = false;
    let timerSeconds = 0;
    let ratioIndex = 0;
    let digitalZoom = 1;
    let activeFilter = "none";
    let captureLocked = false;
    let toastTimer = null;
    let objectUrls = [];
    let destroyed = false;
    const removeListeners = [];

    function listen(target, eventName, handler, options) {
        target?.addEventListener(eventName, handler, options);
        removeListeners.push(() => target?.removeEventListener(eventName, handler, options));
    }

    function setStatus(message, type = "") {
        el.statusText.textContent = message;
        el.status.classList.remove("is-live", "is-error");
        if (type) el.status.classList.add(type);
    }

    function showToast(message) {
        clearTimeout(toastTimer);
        el.toast.textContent = message;
        el.toast.classList.add("is-visible");
        toastTimer = window.setTimeout(() => el.toast.classList.remove("is-visible"), 2300);
    }

    function showPermission(title, message, buttonText = "Enable camera") {
        el.permissionTitle.textContent = title;
        el.permissionMessage.textContent = message;
        el.enableButton.textContent = buttonText;
        el.permission.classList.remove("is-hidden");
        el.captureButton.disabled = true;
    }

    function hidePermission() {
        el.permission.classList.add("is-hidden");
    }

    function isInAppBrowser() {
        return /Instagram|FBAN|FBAV|Line\/|LinkedInApp|Twitter|Snapchat|wv\)/i.test(navigator.userAgent);
    }

    function cameraErrorMessage(error) {
        if (isInAppBrowser()) {
            return "This in-app browser may block camera access. Open the page in Safari or Chrome and try again.";
        }

        switch (error?.name) {
            case "NotAllowedError":
            case "PermissionDeniedError":
                return "Camera permission is blocked. Allow Camera for this site in your browser settings, then reload the page.";
            case "NotFoundError":
            case "DevicesNotFoundError":
                return "No usable camera was found on this phone.";
            case "NotReadableError":
            case "TrackStartError":
                return "The camera is being used by another app. Close other camera or video apps, then try again.";
            case "OverconstrainedError":
            case "ConstraintNotSatisfiedError":
                return "The selected camera does not support the requested mode.";
            case "SecurityError":
                return "Camera access requires a secure HTTPS page opened directly in Safari or Chrome.";
            default:
                return error?.message || "The camera could not be opened.";
        }
    }

    function stopStream() {
        if (!stream) return;
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
        el.video.srcObject = null;
        el.captureButton.disabled = true;
    }

    function hasLiveVideoTrack() {
        return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
    }

    async function waitForVideoFrame(timeoutMs = 5000) {
        if (el.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && el.video.videoWidth > 0) {
            return;
        }

        await new Promise((resolve, reject) => {
            let finished = false;
            const timeout = window.setTimeout(() => finish(new Error("The camera opened but no video frame arrived.")), timeoutMs);

            function finish(error) {
                if (finished) return;
                finished = true;
                window.clearTimeout(timeout);
                el.video.removeEventListener("loadeddata", ready);
                el.video.removeEventListener("canplay", ready);
                error ? reject(error) : resolve();
            }

            function ready() {
                if (el.video.videoWidth > 0) finish();
            }

            el.video.addEventListener("loadeddata", ready);
            el.video.addEventListener("canplay", ready);
        });
    }

    async function populateCameraList(preferredDeviceId = activeDeviceId) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        devices = allDevices.filter((device) => device.kind === "videoinput");
        el.cameraSelect.innerHTML = "";

        if (!devices.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No cameras found";
            el.cameraSelect.appendChild(option);
            el.cameraSelect.disabled = true;
            el.switchButton.disabled = true;
            return [];
        }

        devices.forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            el.cameraSelect.appendChild(option);
        });

        const preferredExists = devices.some((device) => device.deviceId === preferredDeviceId);
        if (preferredExists) activeDeviceId = preferredDeviceId;
        else if (!activeDeviceId) activeDeviceId = devices[0].deviceId;

        el.cameraSelect.value = activeDeviceId;
        el.cameraSelect.disabled = false;
        el.switchButton.disabled = devices.length < 2;
        return devices;
    }

    function buildVideoConstraints(deviceId = "") {
        if (deviceId) {
            return {
                deviceId: { exact: deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            };
        }

        const constraints = {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        };

        if (isMobile.matches) {
            constraints.facingMode = { ideal: facingMode };
        }

        return constraints;
    }

    async function startCamera({ deviceId = "", userInitiated = false } = {}) {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("This browser does not support camera access.");
        }

        if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
            throw new Error("Camera access requires HTTPS.");
        }

        if (isMobile.matches && !userInitiated && !hasLiveVideoTrack()) {
            showPermission(
                "Tap to open the camera.",
                "Phones require a direct tap before the browser can request camera access.",
                "Enable camera"
            );
            return;
        }

        stopStream();
        setStatus("Opening camera");
        el.enableButton.disabled = true;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: buildVideoConstraints(deviceId),
                audio: false
            });

            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack?.getSettings?.() || {};
            activeDeviceId = settings.deviceId || deviceId || "";
            facingMode = settings.facingMode || facingMode;

            el.video.muted = true;
            el.video.autoplay = true;
            el.video.setAttribute("playsinline", "");
            el.video.setAttribute("webkit-playsinline", "");
            el.video.srcObject = stream;

            try {
                await el.video.play();
            } catch (playError) {
                console.warn("Initial camera playback was paused by the browser:", playError);
            }

            await waitForVideoFrame();
            await populateCameraList(activeDeviceId);

            hidePermission();
            el.captureButton.disabled = false;
            setStatus(videoTrack?.label || "Camera ready", "is-live");
        } catch (error) {
            console.error("Camera start failed:", error);
            stopStream();
            setStatus("Camera unavailable", "is-error");
            showPermission("Camera unavailable.", cameraErrorMessage(error), "Try again");
            throw error;
        } finally {
            el.enableButton.disabled = false;
        }
    }

    async function resumeCamera() {
        if (!hasLiveVideoTrack()) return false;

        try {
            el.video.muted = true;
            await el.video.play();
            await waitForVideoFrame(2500);
            hidePermission();
            el.captureButton.disabled = false;
            return true;
        } catch (error) {
            console.warn("Camera resume failed:", error);
            showPermission(
                "Tap to resume the camera.",
                "The browser paused the preview. Tap below to resume it.",
                "Resume camera"
            );
            return false;
        }
    }

    function applyPreviewEffects() {
        el.stage.style.setProperty("--webcam-zoom", String(digitalZoom));
        el.stage.style.setProperty("--webcam-filter", FILTERS[activeFilter] || "none");
        el.video.classList.toggle("is-mirrored", mirrored);

        document.querySelectorAll("#webcam-zoom-strip [data-zoom], #webcam-settings-zoom [data-zoom]").forEach((button) => {
            button.classList.toggle("is-active", Number(button.dataset.zoom) === digitalZoom);
        });

        el.filterStrip.querySelectorAll("[data-filter]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.filter === activeFilter);
        });
    }

    function toggleGrid() {
        gridEnabled = !gridEnabled;
        el.grid.classList.toggle("is-visible", gridEnabled);
        el.gridButton.classList.toggle("is-active", gridEnabled);
        el.gridButton.setAttribute("aria-pressed", String(gridEnabled));
    }

    function toggleMirror() {
        mirrored = !mirrored;
        el.mirrorButton.textContent = mirrored ? "Mirror on" : "Mirror off";
        el.mirrorButton.setAttribute("aria-pressed", String(mirrored));
        applyPreviewEffects();
    }

    function setSettingsOpen(open) {
        if (open && isMobile.matches) setGalleryOpen(false);
        el.settings.hidden = !open;
        el.settingsButton.setAttribute("aria-expanded", String(open));
        el.settingsButton.classList.toggle("is-active", open);
    }

    function setGalleryOpen(open) {
        if (!isMobile.matches) return;
        if (open) setSettingsOpen(false);
        el.galleryPanel.classList.toggle("is-open", open);
        el.galleryPanel.setAttribute("aria-hidden", String(!open));
        el.galleryBackdrop.classList.toggle("is-open", open);
        el.galleryBackdrop.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("webcam-gallery-open", open);
    }

    function canvasToBlob(canvas, type = "image/jpeg", quality = 0.95) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("The photograph could not be created."));
            }, type, quality);
        });
    }

    function calculateCrop(sourceWidth, sourceHeight) {
        let width = sourceWidth / digitalZoom;
        let height = sourceHeight / digitalZoom;
        let x = (sourceWidth - width) / 2;
        let y = (sourceHeight - height) / 2;
        const desiredRatio = RATIOS[ratioIndex].value;

        if (!desiredRatio) return { x, y, width, height };

        if (width / height > desiredRatio) {
            const adjustedWidth = height * desiredRatio;
            x += (width - adjustedWidth) / 2;
            width = adjustedWidth;
        } else {
            const adjustedHeight = width / desiredRatio;
            y += (height - adjustedHeight) / 2;
            height = adjustedHeight;
        }

        return { x, y, width, height };
    }

    async function runCountdown() {
        if (!timerSeconds) return;

        await new Promise((resolve) => {
            let remaining = timerSeconds;
            el.countdown.textContent = String(remaining);
            el.countdown.classList.add("is-visible");

            const interval = window.setInterval(() => {
                remaining -= 1;
                if (remaining <= 0) {
                    window.clearInterval(interval);
                    el.countdown.textContent = "";
                    el.countdown.classList.remove("is-visible");
                    resolve();
                    return;
                }
                el.countdown.textContent = String(remaining);
            }, 1000);
        });
    }

    function triggerFlash() {
        el.flash.classList.remove("is-active");
        void el.flash.offsetWidth;
        el.flash.classList.add("is-active");
    }

    async function capturePhoto() {
        if (captureLocked) return;

        if (!hasLiveVideoTrack()) {
            showPermission("Open the camera first.", "Tap below to allow camera access.", "Enable camera");
            return;
        }

        if (el.video.paused || el.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            const resumed = await resumeCamera();
            if (!resumed) return;
        }

        captureLocked = true;
        el.captureButton.disabled = true;

        try {
            await runCountdown();

            const sourceWidth = el.video.videoWidth;
            const sourceHeight = el.video.videoHeight;
            if (!sourceWidth || !sourceHeight) throw new Error("No camera frame is available yet.");

            const crop = calculateCrop(sourceWidth, sourceHeight);
            el.canvas.width = Math.round(crop.width);
            el.canvas.height = Math.round(crop.height);

            const context = el.canvas.getContext("2d", { alpha: false });
            context.save();

            if (mirrored) {
                context.translate(el.canvas.width, 0);
                context.scale(-1, 1);
            }

            context.filter = FILTERS[activeFilter] || "none";
            context.drawImage(
                el.video,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                el.canvas.width,
                el.canvas.height
            );
            context.restore();

            const blob = await canvasToBlob(el.canvas);
            await savePhoto({
                id: `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}`,
                createdAt: Date.now(),
                width: el.canvas.width,
                height: el.canvas.height,
                ratio: RATIOS[ratioIndex].label,
                filter: activeFilter,
                digitalZoom,
                enhanced: false,
                blob
            });

            triggerFlash();
            await renderGallery();
            showToast("Photograph saved locally");
        } catch (error) {
            console.error(error);
            showToast(error.message || "The photograph could not be saved");
        } finally {
            captureLocked = false;
            el.captureButton.disabled = !hasLiveVideoTrack();
        }
    }

    function openDatabase() {
        if (!("indexedDB" in window)) {
            return Promise.reject(new Error("Local photo storage is unavailable."));
        }

        if (databasePromise) return databasePromise;

        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("createdAt", "createdAt");
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Photo storage could not be opened."));
            request.onblocked = () => reject(new Error("Photo storage is blocked by another tab."));
        });

        return databasePromise;
    }

    async function savePhoto(photo) {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            transaction.objectStore(STORE_NAME).put(photo);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error("The photograph could not be stored."));
        });
    }

    async function getPhotos() {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
            request.onsuccess = () => resolve((request.result || []).sort((a, b) => b.createdAt - a.createdAt));
            request.onerror = () => reject(request.error || new Error("Saved photographs could not be loaded."));
        });
    }

    async function deletePhoto(id) {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            transaction.objectStore(STORE_NAME).delete(id);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error("The photograph could not be deleted."));
        });
    }

    async function clearPhotos() {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            transaction.objectStore(STORE_NAME).clear();
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error("The archive could not be cleared."));
        });
    }

    async function blobToImage(blob) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("The photograph could not be processed."));
            };
            image.src = url;
        });
    }

    async function toggleEnhancement(photo) {
        if (photo.enhanced && photo.originalBlob) {
            photo.blob = photo.originalBlob;
            photo.originalBlob = null;
            photo.enhanced = false;
            await savePhoto(photo);
            await renderGallery();
            showToast("Original photograph restored");
            return;
        }

        const image = await blobToImage(photo.blob);
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { alpha: false });
        context.filter = "brightness(1.035) contrast(1.09) saturate(1.12)";
        context.drawImage(image, 0, 0);
        const enhancedBlob = await canvasToBlob(canvas, "image/jpeg", 0.96);

        photo.originalBlob = photo.blob;
        photo.blob = enhancedBlob;
        photo.enhanced = true;
        await savePhoto(photo);
        await renderGallery();
        showToast("Photograph enhanced");
    }

    function revokeObjectUrls() {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls = [];
    }

    function fileName(createdAt, suffix = "") {
        const date = new Date(createdAt);
        const pad = (value) => String(value).padStart(2, "0");
        return `web-cam_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}${suffix}.jpg`;
    }

    function downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1400);
    }

    function emptyGallery() {
        const element = document.createElement("div");
        element.className = "webcam-empty-gallery";
        element.innerHTML = "<span>04</span><strong>Your archive is empty.</strong><p>Use the shutter to create a photograph. Nothing leaves this browser.</p>";
        return element;
    }

    function photoCard(photo, url) {
        const card = document.createElement("article");
        card.className = "webcam-photo-card";

        const image = document.createElement("img");
        image.src = url;
        image.alt = `Photograph taken ${new Date(photo.createdAt).toLocaleString()}`;
        image.loading = "lazy";

        const meta = document.createElement("div");
        meta.className = "webcam-photo-meta";

        const time = document.createElement("time");
        time.className = "webcam-photo-time";
        time.dateTime = new Date(photo.createdAt).toISOString();
        time.textContent = `${new Date(photo.createdAt).toLocaleString()} · ${photo.ratio || "4:3"}${photo.enhanced ? " · Enhanced" : ""}`;

        const actions = document.createElement("div");
        actions.className = "webcam-photo-actions";

        const download = document.createElement("button");
        download.type = "button";
        download.className = "webcam-photo-download";
        download.textContent = "Download";
        download.addEventListener("click", () => downloadBlob(photo.blob, fileName(photo.createdAt)));

        const enhance = document.createElement("button");
        enhance.type = "button";
        enhance.className = "webcam-photo-enhance";
        enhance.textContent = photo.enhanced ? "Restore" : "Enhance";
        enhance.addEventListener("click", async () => {
            enhance.disabled = true;
            try {
                await toggleEnhancement(photo);
            } catch (error) {
                console.error(error);
                showToast("Enhancement failed");
                enhance.disabled = false;
            }
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "webcam-photo-delete";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Delete photograph");
        remove.addEventListener("click", async () => {
            await deletePhoto(photo.id);
            await renderGallery();
            showToast("Photograph deleted");
        });

        actions.append(download, enhance, remove);
        meta.append(time, actions);
        card.append(image, meta);
        return card;
    }

    function updateThumbnail(photo, url) {
        el.galleryButton.innerHTML = "";
        if (!photo || !url) {
            const empty = document.createElement("span");
            empty.className = "webcam-empty-thumbnail";
            empty.textContent = "04";
            el.galleryButton.appendChild(empty);
            return;
        }

        const image = document.createElement("img");
        image.src = url;
        image.alt = "Open saved photographs";
        el.galleryButton.appendChild(image);
    }

    async function renderGallery() {
        try {
            const photos = await getPhotos();
            revokeObjectUrls();
            el.gallery.innerHTML = "";
            el.photoCount.textContent = `${photos.length} saved`;
            el.downloadAll.disabled = photos.length === 0;
            el.deleteAll.disabled = photos.length === 0;

            if (!photos.length) {
                el.gallery.appendChild(emptyGallery());
                updateThumbnail(null, null);
                return;
            }

            photos.forEach((photo, index) => {
                const url = URL.createObjectURL(photo.blob);
                objectUrls.push(url);
                el.gallery.appendChild(photoCard(photo, url));
                if (index === 0) updateThumbnail(photo, url);
            });
        } catch (error) {
            console.error(error);
            el.gallery.innerHTML = "";
            el.gallery.appendChild(emptyGallery());
            showToast("Local photo storage is unavailable");
        }
    }

    async function switchCamera() {
        if (devices.length > 1) {
            const currentIndex = Math.max(0, devices.findIndex((device) => device.deviceId === activeDeviceId));
            const nextDevice = devices[(currentIndex + 1) % devices.length];
            await startCamera({ deviceId: nextDevice.deviceId, userInitiated: true });
            return;
        }

        facingMode = facingMode === "user" ? "environment" : "user";
        await startCamera({ userInitiated: true });
    }

    listen(el.enableButton, "click", async () => {
        setGalleryOpen(false);
        setSettingsOpen(false);
        try {
            if (hasLiveVideoTrack()) await resumeCamera();
            else await startCamera({ userInitiated: true });
        } catch {
            // The visible permission panel already explains the failure.
        }
    });

    listen(el.captureButton, "click", capturePhoto);
    listen(el.switchButton, "click", async () => {
        el.switchButton.disabled = true;
        try {
            await switchCamera();
        } catch (error) {
            console.error(error);
        } finally {
            el.switchButton.disabled = devices.length < 2 && !isMobile.matches;
        }
    });

    listen(el.gridButton, "click", toggleGrid);
    listen(el.mirrorButton, "click", toggleMirror);

    listen(el.timerButton, "click", () => {
        const values = [0, 3, 5, 10];
        timerSeconds = values[(values.indexOf(timerSeconds) + 1) % values.length];
        el.timerLabel.textContent = `${timerSeconds}s`;
        el.timerButton.classList.toggle("is-active", timerSeconds > 0);
        el.timerButton.title = timerSeconds ? `Timer ${timerSeconds} seconds` : "Timer off";
        showToast(timerSeconds ? `${timerSeconds}-second timer` : "Timer disabled");
    });

    listen(el.ratioButton, "click", () => {
        ratioIndex = (ratioIndex + 1) % RATIOS.length;
        const ratio = RATIOS[ratioIndex];
        el.stage.dataset.ratio = ratio.key;
        el.ratioLabel.textContent = ratio.label;
        el.ratioButton.classList.toggle("is-active", ratioIndex !== 0);
        showToast(`Photo ratio ${ratio.label}`);
    });

    listen(el.settingsButton, "click", () => setSettingsOpen(el.settings.hidden));
    listen(el.settingsClose, "click", () => setSettingsOpen(false));
    listen(el.galleryButton, "click", () => setGalleryOpen(true));
    listen(el.galleryClose, "click", () => setGalleryOpen(false));
    listen(el.galleryBackdrop, "click", () => setGalleryOpen(false));

    listen(el.downloadAll, "click", async () => {
        const photos = await getPhotos();
        for (let index = 0; index < photos.length; index += 1) {
            downloadBlob(photos[index].blob, fileName(photos[index].createdAt, `_${index + 1}`));
            await new Promise((resolve) => window.setTimeout(resolve, 180));
        }
        if (photos.length) showToast(`Downloading ${photos.length} photographs`);
    });

    listen(el.deleteAll, "click", async () => {
        const photos = await getPhotos();
        if (!photos.length) return;
        if (!window.confirm(`Delete all ${photos.length} photographs from this browser?`)) return;
        await clearPhotos();
        await renderGallery();
        showToast("Local archive cleared");
    });

    listen(el.refreshButton, "click", async () => {
        el.refreshButton.disabled = true;
        try {
            const cameraList = await populateCameraList(activeDeviceId);
            showToast(`${cameraList.length} ${cameraList.length === 1 ? "camera" : "cameras"} detected`);
        } catch (error) {
            console.error(error);
            showToast(cameraErrorMessage(error));
        } finally {
            el.refreshButton.disabled = false;
        }
    });

    listen(el.cameraSelect, "change", async () => {
        const nextDeviceId = el.cameraSelect.value;
        if (!nextDeviceId || nextDeviceId === activeDeviceId) return;
        el.cameraSelect.disabled = true;
        try {
            await startCamera({ deviceId: nextDeviceId, userInitiated: true });
        } catch {
            await populateCameraList(activeDeviceId).catch(() => {});
        } finally {
            el.cameraSelect.disabled = false;
        }
    });

    listen(el.filterStrip, "click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        const requestedFilter = button.dataset.filter;
        activeFilter = FILTERS[requestedFilter] ? requestedFilter : "none";
        applyPreviewEffects();
        showToast(`${activeFilter === "none" ? "Natural" : activeFilter} filter`);
    });

    const zoomClick = (event) => {
        const button = event.target.closest("[data-zoom]");
        if (!button) return;
        digitalZoom = Math.max(1, Math.min(2, Number(button.dataset.zoom) || 1));
        applyPreviewEffects();
        showToast(`Digital zoom ${digitalZoom.toFixed(digitalZoom % 1 ? 1 : 0)}×`);
    };

    listen(el.zoomStrip, "click", zoomClick);
    listen(el.settingsZoom, "click", zoomClick);

    listen(el.stage, "click", async (event) => {
        if (event.target.closest("button, select, .webcam-settings")) return;
        if (hasLiveVideoTrack() && el.video.paused) await resumeCamera();
    });

    listen(document, "visibilitychange", () => {
        if (document.visibilityState === "visible" && hasLiveVideoTrack()) {
            window.setTimeout(resumeCamera, 120);
        }
    });

    listen(window, "pageshow", () => {
        if (hasLiveVideoTrack()) window.setTimeout(resumeCamera, 120);
    });

    listen(document, "keydown", (event) => {
        const activeElement = document.activeElement;
        if (activeElement?.matches("input, textarea, select") || activeElement?.isContentEditable) return;

        if (event.code === "Space") {
            event.preventDefault();
            capturePhoto();
        } else if (event.key.toLowerCase() === "g") {
            toggleGrid();
        } else if (event.key.toLowerCase() === "m") {
            toggleMirror();
        } else if (event.key.toLowerCase() === "s") {
            setSettingsOpen(el.settings.hidden);
        } else if (event.key === "Escape") {
            setSettingsOpen(false);
            setGalleryOpen(false);
        }
    });

    const deviceChangeHandler = () => populateCameraList(activeDeviceId).catch(console.error);
    navigator.mediaDevices?.addEventListener?.("devicechange", deviceChangeHandler);

    function initialize() {
        setGalleryOpen(false);
        setSettingsOpen(false);
        el.video.muted = true;
        el.video.setAttribute("playsinline", "");
        el.video.setAttribute("webkit-playsinline", "");
        applyPreviewEffects();
        renderGallery();

        if (isMobile.matches) {
            setStatus("Tap to enable camera");
            showPermission(
                "Tap to open the camera.",
                isInAppBrowser()
                    ? "Open this page in Safari or Chrome, then tap Enable camera."
                    : "Your phone will ask for camera permission after you tap the button.",
                "Enable camera"
            );
        } else {
            startCamera({ userInitiated: true }).catch(() => {});
        }
    }

    initialize();

    window.destroyWebcam = () => {
        if (destroyed) return;
        destroyed = true;
        clearTimeout(toastTimer);
        stopStream();
        revokeObjectUrls();
        removeListeners.forEach((remove) => remove());
        navigator.mediaDevices?.removeEventListener?.("devicechange", deviceChangeHandler);
        delete window.destroyWebcam;
    };
})();

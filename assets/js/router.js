const basePath = window.location.hostname.includes("github.io") ? "/webtools" : "";

const routes = {
    "/": {
        template: "pages/home.html",
        title: "Web Tools",
        kicker: "Desk Index",
        description: "A paper-organized collection of browser-side utilities for inspection, encoding, and link experiments.",
        summary: "Start here to open the major worksheets or browse the smaller URL experiments."
    },
    "/browser-fingerprinting": {
        template: "pages/browser_fingerprinting.html",
        title: "Browser Fingerprinting",
        kicker: "Inspection Worksheet",
        description: "Review the signals your browser exposes locally across browser, device, and network categories.",
        summary: "A readable local snapshot of browser capabilities and environment details.",
        script: "assets/js/browser_fingerprinting.js",
        css: "assets/css/browser_fingerprinting.css"
    },
    "/cryptography": {
        template: "pages/cryptography.html",
        title: "Cryptography",
        kicker: "Encoding Worksheet",
        description: "Hash, encode, decode, encrypt, and transform text directly in the browser without sending it anywhere else.",
        summary: "A live text workbench for hashes, ciphers, and reversible conversions.",
        scripts: [
            "assets/js/crypto-js.min.js",
            "assets/js/aes.min.js",
            "assets/js/zcrypt.js",
            "assets/js/cryptography.js"
        ],
        css: "assets/css/cryptography.css"
    },
    "/psychology": {
        template: "pages/psychology.html",
        title: "Psychology",
        kicker: "Diagnostics",
        description: "A secure cabinet of psychological tests securely evaluated on your local device.",
        summary: "Explore personality models and relationship dynamics without leaving a paper trail."
    },
    "/only-yes": {
        template: "pages/onlyyes.html",
        title: "Only Yes",
        kicker: "Prank Drawer",
        description: "A playful prompt page where the yes button stays put and the no button refuses to cooperate.",
        summary: "A small novelty page with customizable question, answer, and button labels.",
        script: "assets/js/onlyyes.js",
        css: "assets/css/onlyyes.css"
    }
};

const appElement = document.getElementById("app");
const pageKickerElement = document.getElementById("page-kicker");
const pageTitleElement = document.getElementById("page-title");
const pageDescriptionElement = document.getElementById("page-description");
const routeKickerElement = document.getElementById("route-kicker");
const routeSummaryElement = document.getElementById("route-summary");
const backButton = document.getElementById("btn-back");
const themeButton = document.getElementById("btn-theme");

function withBasePath(path) {
    if (!path) return basePath || "/";
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${normalizedPath}`.replace(/\/{2,}/g, "/");
}

function normalizePath(pathname) {
    let path = pathname || "/";

    if (basePath && path.startsWith(basePath)) {
        path = path.slice(basePath.length) || "/";
    }

    if (!path.startsWith("/")) {
        path = `/${path}`;
    }

    if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
    }

    return path || "/";
}

function updateThemeButton() {
    if (!themeButton) return;
    themeButton.textContent = document.body.classList.contains("night-mode") ? "Paper White" : "Night Ink";
}

function updateNavigation(path) {
    document.querySelectorAll(".site-nav a[data-route]").forEach((link) => {
        if (link.dataset.route === path) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function updateRouteMeta(path, routeInfo) {
    if (pageKickerElement) pageKickerElement.textContent = routeInfo.kicker;
    if (pageTitleElement) pageTitleElement.textContent = routeInfo.title;
    if (pageDescriptionElement) pageDescriptionElement.textContent = routeInfo.description;
    if (routeKickerElement) routeKickerElement.textContent = routeInfo.kicker;
    if (routeSummaryElement) routeSummaryElement.textContent = routeInfo.summary;
    if (backButton) backButton.hidden = path === "/";

    document.title = `${routeInfo.title} | Web Tools`;
    document.body.dataset.route = path === "/" ? "desk-index" : path.slice(1);
}

function removeDynamicAssets() {
    document.querySelectorAll('script[data-dynamic-router="true"]').forEach((element) => element.remove());
    document.querySelectorAll('link[data-dynamic-router="true"]').forEach((element) => element.remove());
}

function loadCSS(path) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = withBasePath(path);
    link.setAttribute("data-dynamic-router", "true");
    document.head.appendChild(link);
}

function loadScript(path) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = withBasePath(path);
        script.async = false;
        script.setAttribute("data-dynamic-router", "true");
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

async function loadScripts(paths) {
    for (const path of paths) {
        await loadScript(path);
    }
}

const route = async (event) => {
    const anchor = event?.currentTarget || event?.target?.closest("a");
    if (!anchor) {
        await handleLocation();
        return;
    }

    if (event) {
        event.preventDefault();
    }

    const rawHref = anchor.getAttribute("href") || "/";
    const nextLocation = rawHref.startsWith("/") ? withBasePath(rawHref) : rawHref;
    window.history.pushState({}, "", nextLocation);
    await handleLocation();
};

const handleLocation = async () => {
    const path = normalizePath(window.location.pathname);
    const routeInfo = routes[path] || routes["/"];

    updateNavigation(path);
    updateRouteMeta(path, routeInfo);

    try {
        const response = await fetch(withBasePath(routeInfo.template));
        if (!response.ok) {
            throw new Error(`Unable to load ${routeInfo.template}`);
        }

        const html = await response.text();
        if (appElement) {
            appElement.innerHTML = html;
        }

        removeDynamicAssets();

        if (routeInfo.css) {
            loadCSS(routeInfo.css);
        }

        if (routeInfo.scripts) {
            await loadScripts(routeInfo.scripts);
        } else if (routeInfo.script) {
            await loadScript(routeInfo.script);
        }
    } catch (error) {
        console.error("Routing error:", error);
        if (appElement) {
            appElement.innerHTML = `
                <section class="paper-panel">
                    <p class="panel-kicker">Missing Page</p>
                    <h3 class="panel-title">The requested worksheet could not be loaded.</h3>
                    <p class="panel-copy">Return to the desk index and try another tool.</p>
                </section>
            `;
        }
    }
};

window.route = route;
window.goBack = () => {
    window.history.back();
};
window.toggleTheme = () => {
    document.body.classList.toggle("night-mode");
    localStorage.setItem("theme", document.body.classList.contains("night-mode") ? "night" : "paper");
    updateThemeButton();
};

window.onpopstate = handleLocation;

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "night" || savedTheme === "dark") {
        document.body.classList.add("night-mode");
    }

    updateThemeButton();

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get("p");
    const redirectQuery = urlParams.get("q");
    if (redirectPath) {
        const cleanPath = redirectPath.replace(/~and~/g, "&");
        const cleanQuery = redirectQuery ? `?${redirectQuery.replace(/~and~/g, "&")}` : "";
        window.history.replaceState({}, "", withBasePath(`${cleanPath}${cleanQuery}`));
    }

    handleLocation();
});

// Global Keyboard Shortcuts
document.addEventListener("keydown", (event) => {
    // Ignore if typing in an input or textarea
    const activeElement = document.activeElement;
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable) {
        return;
    }

    if (event.shiftKey) {
        let index = null;
        switch (event.key) {
            case "0": index = "00"; break;
            case "1": index = "01"; break;
            case "2": index = "02"; break;
            case "3": index = "03"; break;
            case "4": index = "04"; break;
        }

        if (index !== null) {
            const link = document.querySelector(`.site-nav a[data-index="${index}"]`);
            if (link) {
                event.preventDefault();
                link.click();
            }
        }
    }
});

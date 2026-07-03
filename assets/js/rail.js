(() => {
    "use strict";

    const rail = document.getElementById("site-rail");
    const toggle = document.getElementById("btn-rail-toggle");
    const content = document.getElementById("rail-content");

    if (!rail || !toggle || !content) return;

    const mobileQuery = window.matchMedia("(max-width: 760px)");

    function applyCollapsed(collapsed, persist = true) {
        document.body.classList.toggle("rail-collapsed", collapsed);
        rail.classList.toggle("is-collapsed", collapsed);
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.title = collapsed ? "Expand side panel" : "Collapse side panel";

        if (persist && !mobileQuery.matches) {
            localStorage.setItem("webtools-rail", collapsed ? "collapsed" : "expanded");
        }
    }

    function applyResponsiveState() {
        if (mobileQuery.matches) {
            applyCollapsed(true, false);
            return;
        }

        applyCollapsed(localStorage.getItem("webtools-rail") === "collapsed", false);
    }

    toggle.addEventListener("click", () => {
        applyCollapsed(!document.body.classList.contains("rail-collapsed"));
    });

    mobileQuery.addEventListener?.("change", applyResponsiveState);
    applyResponsiveState();
})();

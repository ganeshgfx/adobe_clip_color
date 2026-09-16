/**
 * main.js — Clip Color Changer panel logic
 */
(function () {
    "use strict";

    /* ── After Effects label colors ─────────────────────────── */
    var LABELS_AE = [
        { index: 0, name: "None", hex: "#555555" },
        { index: 1, name: "Red", hex: "#C83228" },
        { index: 2, name: "Yellow", hex: "#E8C84B" },
        { index: 3, name: "Aqua", hex: "#50B4C8" },
        { index: 4, name: "Pink", hex: "#E87898" },
        { index: 5, name: "Lavender", hex: "#9664C8" },
        { index: 6, name: "Peach", hex: "#E0A050" },
        { index: 7, name: "Sea Foam", hex: "#6EC896" },
        { index: 8, name: "Blue", hex: "#5064C8" },
        { index: 9, name: "Green", hex: "#64C846" },
        { index: 10, name: "Purple", hex: "#7850C8" },
        { index: 11, name: "Orange", hex: "#E87832" },
        { index: 12, name: "Brown", hex: "#A06432" },
        { index: 13, name: "Fuchsia", hex: "#C832C8" },
        { index: 14, name: "Cyan", hex: "#32B4C8" },
        { index: 15, name: "Sandstone", hex: "#C8B464" },
        { index: 16, name: "Dark Green", hex: "#3C8C3C" }
    ];

    /* ── Premiere Pro label colors — matched to Premiere's actual display ── */
    var LABELS_PPRO = [
        { index: 0, name: "None", hex: "#555555" },
        { index: 1, name: "Violet", hex: "#7B68C8" },  // muted purple
        { index: 2, name: "Iris", hex: "#6888C0" },  // slate blue
        { index: 3, name: "Caribbean", hex: "#38C0A8" },  // bright teal
        { index: 4, name: "Lavender", hex: "#B898D8" },  // light lilac
        { index: 5, name: "Cerulean", hex: "#4890C8" },  // medium blue
        { index: 6, name: "Forest", hex: "#488848" },  // dark green
        { index: 7, name: "Rose", hex: "#C86878" },  // dusty rose/salmon
        { index: 8, name: "Mango", hex: "#E09040" },  // amber orange
        { index: 9, name: "Purple", hex: "#9050B8" },  // medium purple
        { index: 10, name: "Blue", hex: "#4878C8" },  // clear blue
        { index: 11, name: "Teal", hex: "#308898" },  // steel teal
        { index: 12, name: "Magenta", hex: "#C84890" },  // pink-magenta
        { index: 13, name: "Tan", hex: "#C8A850" },  // golden tan
        { index: 14, name: "Green", hex: "#48A848" },  // medium green
        { index: 15, name: "Brown", hex: "#886038" },  // warm brown
        { index: 16, name: "Yellow", hex: "#D0C040" }   // golden yellow
    ];

    /* ── State ───────────────────────────────────────────────── */
    var hostApp = "UNKNOWN";
    var cs = CSInterface;
    var toastTimer = null;
    var LABELS = LABELS_PPRO;
    var prFirstUse = false; // show setup overlay on first Pr color click

    /* ── Init ────────────────────────────────────────────────── */
    function init() {
        detectHost();
        LABELS = (hostApp === "AEFT") ? LABELS_AE : LABELS_PPRO;
        buildColorGrid();
        updateAppBadge();
        setupOverlay();

        // Premiere Pro: show info icon in header
        if (hostApp === "PPRO") {
            var infoIcon = document.getElementById("infoIcon");
            if (infoIcon) infoIcon.style.display = "inline";
            var hint = document.getElementById("footerHint");
            if (hint) hint.textContent = "Select clips, then click a color";
            prFirstUse = true;
        }
    }

    function detectHost() {
        try {
            var env = cs.getHostEnvironment();
            hostApp = env.appId || "UNKNOWN";
        } catch (e) { hostApp = "UNKNOWN"; }
    }

    /* ── Build Color Grid ────────────────────────────────────── */
    function buildColorGrid() {
        var grid = document.getElementById("colorGrid");
        if (!grid) return;
        grid.innerHTML = "";

        LABELS.forEach(function (label) {
            var btn = document.createElement("button");
            btn.className = "color-btn" + (label.index === 0 ? " color-btn--none" : "");
            btn.id = "color-btn-" + label.index;
            btn.title = label.name + " (" + label.index + ")";
            btn.setAttribute("aria-label", "Label: " + label.name);
            btn.dataset.index = label.index;

            if (label.index === 0) {
                btn.innerHTML = '<span class="none-icon">&#x2715;</span>';
                btn.style.background = "#3a3a3a";
                btn.style.border = "2px dashed #666";
            } else {
                btn.style.background = label.hex;
                btn.style.boxShadow = "0 2px 8px " + hexToRgba(label.hex, 0.38);
            }

            btn.addEventListener("click", function () {
                onColorClick(label.index, label.name, label.hex, btn);
            });
            grid.appendChild(btn);
        });
    }

    /* ── Color Click ─────────────────────────────────────────── */
    function onColorClick(labelIndex, labelName, hex, btn) {
        btn.classList.add("active");
        setTimeout(function () { btn.classList.remove("active"); }, 400);
        document.querySelectorAll(".color-btn").forEach(function (b) {
            b.classList.remove("selected");
        });
        btn.classList.add("selected");

        if (hostApp === "AEFT") {
            cs.evalScript("ae_applyColor(" + labelIndex + ")", function (res) {
                handleAEResult(res, labelName, hex);
            });
        } else if (hostApp === "PPRO") {
            cs.evalScript("ppro_applyColor(" + labelIndex + ")", function (res) {
                handlePRResult(res, labelName, hex);
            });
        } else {
            showToast("Unknown host app", "warn");
        }
    }

    /* ── AE Result ───────────────────────────────────────────── */
    function handleAEResult(result, labelName, hex) {
        if (!result || result === "undefined" || result.indexOf("OK") !== -1) {
            showToast(labelName + " applied", "ok", hex);
        } else if (result.indexOf("NO_COMP") !== -1) {
            showToast("Open a composition first", "warn");
        } else if (result.indexOf("NO_SEL") !== -1) {
            showToast("Nothing selected", "warn");
        } else {
            showToast(labelName + " applied", "ok", hex);
        }
    }

    /* ── Premiere Result ─────────────────────────────────────── */
    function handlePRResult(result, labelName, hex) {
        if (!result || result === "undefined") {
            showToast(labelName + " applied", "ok", hex);
            return;
        }

        if (result.indexOf("OK") !== -1) {
            // Parse counts from "OK|timeline:N|project:M"
            var timelineMatch = result.match(/timeline:(\d+)/);
            var projectMatch = result.match(/project:(\d+)/);
            var tCount = timelineMatch ? parseInt(timelineMatch[1]) : 0;
            var pCount = projectMatch ? parseInt(projectMatch[1]) : 0;

            if (tCount > 0 && pCount > 0) {
                showToast(labelName + " — " + tCount + " clip(s) + " + pCount + " bin item(s)", "ok", hex);
            } else if (tCount > 0) {
                showToast(labelName + " — " + tCount + " timeline clip(s)", "ok", hex);
                // Show setup hint on first success (timeline clips changed)
                if (prFirstUse) {
                    prFirstUse = false;
                    setTimeout(function () {
                        showToast("Tip: Enable 'Show Source Clip Name and Label' in Timeline wrench menu to see colors", "warn");
                    }, 2800);
                }
            } else if (pCount > 0) {
                showToast(labelName + " — " + pCount + " project item(s)", "ok", hex);
            } else {
                showToast(labelName + " applied", "ok", hex);
            }
        } else if (result === "NO_SEL") {
            showToast("Select clips on timeline or items in Project panel", "warn");
        } else if (result.indexOf("NO_SEQ") !== -1) {
            showToast("No active sequence open", "warn");
        } else {
            showToast(labelName + " applied", "ok", hex);
        }
    }

    /* ── Setup Overlay ───────────────────────────────────────── */
    function setupOverlay() {
        var overlay = document.getElementById("setupOverlay");
        var closeBtn = document.getElementById("overlayCloseBtn");
        var infoIcon = document.getElementById("infoIcon");

        if (infoIcon && overlay) {
            infoIcon.addEventListener("click", function () {
                overlay.classList.add("visible");
            });
            infoIcon.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") overlay.classList.add("visible");
            });
        }
        if (closeBtn && overlay) {
            closeBtn.addEventListener("click", function () {
                overlay.classList.remove("visible");
            });
        }
    }

    /* ── Badge ───────────────────────────────────────────────── */
    function updateAppBadge() {
        var b = document.getElementById("appBadge");
        if (!b) return;
        if (hostApp === "AEFT") {
            b.textContent = "AE";
            b.style.cssText = "background:#2c2c9e;color:#c8d4ff";
        } else if (hostApp === "PPRO") {
            b.textContent = "Pr";
            b.style.cssText = "background:#1a1a4e;color:#8db4ff";
        } else {
            b.textContent = "?";
        }
    }

    /* ── Toast ───────────────────────────────────────────────── */
    function showToast(msg, type, accentHex) {
        var t = document.getElementById("toast");
        if (!t) return;
        if (toastTimer) clearTimeout(toastTimer);
        var icon = type === "ok" ? "&#x2713; " : type === "warn" ? "&#x26A0; " : "&#x2717; ";
        t.innerHTML = icon + msg;
        t.className = "toast toast--" + (type || "ok") + " toast--visible";
        t.style.borderLeft = (accentHex && type === "ok") ? "3px solid " + accentHex : "";
        toastTimer = setTimeout(function () { t.classList.remove("toast--visible"); }, 3000);
    }

    /* ── Util ────────────────────────────────────────────────── */
    function hexToRgba(hex, a) {
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else { init(); }
})();

/**
 * main.js — Clip Color Changer panel logic
 */

(function () {
    "use strict";

    /* ── After Effects label colors (indices 0-16, AE order) ─── */
    var LABELS_AE = [
        { index: 0,  name: "None",       hex: "#555555" },
        { index: 1,  name: "Red",        hex: "#C83228" },
        { index: 2,  name: "Yellow",     hex: "#E8C84B" },
        { index: 3,  name: "Aqua",       hex: "#50B4C8" },
        { index: 4,  name: "Pink",       hex: "#E87898" },
        { index: 5,  name: "Lavender",   hex: "#9664C8" },
        { index: 6,  name: "Peach",      hex: "#E0A050" },
        { index: 7,  name: "Sea Foam",   hex: "#6EC896" },
        { index: 8,  name: "Blue",       hex: "#5064C8" },
        { index: 9,  name: "Green",      hex: "#64C846" },
        { index: 10, name: "Purple",     hex: "#7850C8" },
        { index: 11, name: "Orange",     hex: "#E87832" },
        { index: 12, name: "Brown",      hex: "#A06432" },
        { index: 13, name: "Fuchsia",    hex: "#C832C8" },
        { index: 14, name: "Cyan",       hex: "#32B4C8" },
        { index: 15, name: "Sandstone",  hex: "#C8B464" },
        { index: 16, name: "Dark Green", hex: "#3C8C3C" }
    ];

    /* ── Premiere Pro label colors (indices 0-16, Pr order) ──── */
    var LABELS_PPRO = [
        { index: 0,  name: "None",       hex: "#555555" },
        { index: 1,  name: "Violet",     hex: "#9B59B6" },
        { index: 2,  name: "Iris",       hex: "#5B7FD4" },
        { index: 3,  name: "Caribbean",  hex: "#1ABC9C" },
        { index: 4,  name: "Lavender",   hex: "#BB8FCE" },
        { index: 5,  name: "Cerulean",   hex: "#2980B9" },
        { index: 6,  name: "Forest",     hex: "#27AE60" },
        { index: 7,  name: "Rose",       hex: "#E91E8C" },
        { index: 8,  name: "Mango",      hex: "#F39C12" },
        { index: 9,  name: "Purple",     hex: "#8E44AD" },
        { index: 10, name: "Blue",       hex: "#2E86C1" },
        { index: 11, name: "Teal",       hex: "#148F77" },
        { index: 12, name: "Magenta",    hex: "#C0392B" },
        { index: 13, name: "Tan",        hex: "#C8A951" },
        { index: 14, name: "Green",      hex: "#229954" },
        { index: 15, name: "Brown",      hex: "#795548" },
        { index: 16, name: "Yellow",     hex: "#F1C40F" }
    ];

    /* ── State ───────────────────────────────────────────────── */
    var hostApp    = "UNKNOWN";
    var cs         = CSInterface;
    var toastTimer = null;
    var LABELS     = LABELS_PPRO; // default; overridden after host detection

    /* ── Init ────────────────────────────────────────────────── */
    function init() {
        detectHost();
        LABELS = (hostApp === "AEFT") ? LABELS_AE : LABELS_PPRO;
        buildColorGrid();
        updateAppBadge();
    }

    function detectHost() {
        try {
            var env = cs.getHostEnvironment();
            hostApp = env.appId || "UNKNOWN";
        } catch (e) {
            hostApp = "UNKNOWN";
        }
    }

    /* ── Build Color Grid ────────────────────────────────────── */
    function buildColorGrid() {
        var grid = document.getElementById("colorGrid");
        if (!grid) return;
        grid.innerHTML = "";

        LABELS.forEach(function (label) {
            var btn = document.createElement("button");
            btn.className    = "color-btn" + (label.index === 0 ? " color-btn--none" : "");
            btn.id           = "color-btn-" + label.index;
            btn.title        = label.name + " (" + label.index + ")";
            btn.setAttribute("aria-label", "Set label: " + label.name);
            btn.dataset.index = label.index;

            if (label.index === 0) {
                btn.innerHTML            = '<span class="none-icon">&#x2715;</span>';
                btn.style.background     = "#3a3a3a";
                btn.style.border         = "2px dashed #666";
            } else {
                btn.style.background = label.hex;
                btn.style.boxShadow  = "0 2px 8px " + hexToRgba(label.hex, 0.4);
            }

            btn.addEventListener("click", function () {
                onColorClick(label.index, label.name, label.hex, btn);
            });

            grid.appendChild(btn);
        });
    }

    /* ── Color Click Handler ─────────────────────────────────── */
    function onColorClick(labelIndex, labelName, hex, btn) {
        btn.classList.add("active");
        setTimeout(function () { btn.classList.remove("active"); }, 400);

        document.querySelectorAll(".color-btn").forEach(function (b) {
            b.classList.remove("selected");
        });
        btn.classList.add("selected");

        if (hostApp === "AEFT") {
            applyAE(labelIndex, labelName, hex);
        } else if (hostApp === "PPRO") {
            applyPPRO(labelIndex, labelName, hex);
        } else {
            showToast("Unknown host app", "warn");
        }
    }

    /* ── After Effects Apply ─────────────────────────────────── */
    function applyAE(labelIndex, labelName, hex) {
        cs.evalScript("ae_applyColor(" + labelIndex + ")", function (result) {
            handleResult(result, labelName, hex);
        });
    }

    /* ── Premiere Pro Apply ──────────────────────────────────── */
    function applyPPRO(labelIndex, labelName, hex) {
        cs.evalScript("ppro_applyColor(" + labelIndex + ")", function (result) {
            handleResult(result, labelName, hex);
        });
    }

    /* ── Result Feedback ─────────────────────────────────────── */
    function handleResult(result, labelName, hex) {
        if (!result || result === "undefined") {
            showToast(labelName + " applied", "ok", hex);
            return;
        }
        if (result.indexOf("OK") !== -1) {
            showToast(labelName + " applied", "ok", hex);
        } else if (result === "NO_SEQ") {
            showToast("No active sequence", "warn");
        } else if (result.indexOf("NO_SEL") !== -1 || result.indexOf("NO_COMP") !== -1) {
            showToast("Nothing selected", "warn");
        } else if (result.indexOf("ERR") !== -1) {
            showToast("Error — " + result.replace(/ERR[^:]*:/g, ""), "error");
            console.error("ClipColorChanger:", result);
        } else {
            // Unknown result — treat as warn so user knows
            showToast("No clips found: " + result, "warn");
            console.warn("ClipColorChanger:", result);
        }
    }

    /* ── Toast ───────────────────────────────────────────────── */
    function showToast(msg, type, accentHex) {
        var toast = document.getElementById("toast");
        if (!toast) return;
        if (toastTimer) clearTimeout(toastTimer);

        var icon = type === "ok" ? "&#x2713; " : type === "warn" ? "&#x26A0; " : "&#x2717; ";
        toast.innerHTML   = icon + msg;
        toast.className   = "toast toast--" + (type || "ok") + " toast--visible";
        toast.style.borderLeft = accentHex && type === "ok" ? "3px solid " + accentHex : "";

        toastTimer = setTimeout(function () {
            toast.classList.remove("toast--visible");
        }, 2400);
    }

    /* ── Badge ───────────────────────────────────────────────── */
    function updateAppBadge() {
        var badge = document.getElementById("appBadge");
        if (!badge) return;
        if (hostApp === "AEFT") {
            badge.textContent      = "AE";
            badge.style.background = "#2c2c9e";
            badge.style.color      = "#c8d4ff";
        } else if (hostApp === "PPRO") {
            badge.textContent      = "Pr";
            badge.style.background = "#1a1a4e";
            badge.style.color      = "#8db4ff";
        } else {
            badge.textContent      = "?";
            badge.style.background = "#333";
        }
    }

    /* ── Util ────────────────────────────────────────────────── */
    function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();

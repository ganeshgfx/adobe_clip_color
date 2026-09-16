/* ================================================================
   host.jsx  —  ExtendScript entry point
   ================================================================ */

/* ================================================================
   AFTER EFFECTS
   ================================================================ */

function ae_setSelectedLayersColor(labelIndex) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "NO_COMP";
    var layers = comp.selectedLayers;
    if (!layers || layers.length === 0) return "NO_SEL_LAYERS";
    app.beginUndoGroup("Clip Color Changer");
    for (var i = 0; i < layers.length; i++) {
        layers[i].label = labelIndex;
    }
    app.endUndoGroup();
    return "OK:" + layers.length;
}

function ae_setSelectedProjectItemsColor(labelIndex) {
    var items = app.project.selection;
    if (!items || items.length === 0) return "NO_SEL_PROJ";
    app.beginUndoGroup("Clip Color Changer");
    for (var i = 0; i < items.length; i++) {
        items[i].label = labelIndex;
    }
    app.endUndoGroup();
    return "OK:" + items.length;
}

function ae_applyColor(labelIndex) {
    var r1 = ae_setSelectedLayersColor(labelIndex);
    var r2 = ae_setSelectedProjectItemsColor(labelIndex);
    if (r1.indexOf("OK") !== -1 || r2.indexOf("OK") !== -1) return "OK";
    if (r1 === "NO_COMP") return r2;
    return r1 + "|" + r2;
}

/* ================================================================
   PREMIERE PRO
   ================================================================ */

/**
 * Apply label color to selected timeline clips.
 *
 * Strategy (tries each method in order):
 *   1. seq.getSelection()          — Pr 15.0+ API (most reliable)
 *   2. Iterate tracks, clip.isSelected()  — fallback for older versions
 *
 * Both methods go through clip.projectItem.setColorLabel() because
 * TrackItem has no direct color setter in the Premiere Pro scripting API.
 */
function ppro_setTimelineClipColor(labelIndex) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "NO_SEQ";

        var changed = 0;

        /* ---- Method 1: getSelection() (Pr 14.0+) ------------- */
        try {
            var sel = seq.getSelection();
            if (sel && sel.length > 0) {
                for (var s = 0; s < sel.length; s++) {
                    try {
                        sel[s].projectItem.setColorLabel(labelIndex);
                        changed++;
                    } catch (e) { /* item may not have projectItem */ }
                }
                if (changed > 0) return "OK:" + changed;
            }
        } catch (e) { /* getSelection() not available in this version */ }

        /* ---- Method 2: iterate all tracks -------------------- */
        var trackGroups = [seq.videoTracks, seq.audioTracks];
        for (var g = 0; g < trackGroups.length; g++) {
            var trackList = trackGroups[g];
            for (var i = 0; i < trackList.numTracks; i++) {
                var track = trackList[i];
                for (var j = 0; j < track.clips.numItems; j++) {
                    var clip = track.clips[j];
                    try {
                        if (clip.isSelected()) {
                            clip.projectItem.setColorLabel(labelIndex);
                            changed++;
                        }
                    } catch (e) { /* clip doesn't support isSelected */ }
                }
            }
        }

        return changed > 0 ? "OK:" + changed : "NO_SEL";
    } catch (e) {
        return "ERR_TIMELINE:" + e.message;
    }
}

/**
 * Recursively scan a bin and setColorLabel on selected project items.
 */
function ppro_scanBin(bin, labelIndex) {
    var changed = 0;
    try {
        for (var i = 0; i < bin.children.numItems; i++) {
            var item = bin.children[i];
            try {
                if (item.isSelected()) {
                    item.setColorLabel(labelIndex);
                    changed++;
                }
            } catch (e) { /* item doesn't support isSelected */ }
            try {
                if (item.children && item.children.numItems > 0) {
                    changed += ppro_scanBin(item, labelIndex);
                }
            } catch (e) { /* not a bin */ }
        }
    } catch (e) { /* bin access error */ }
    return changed;
}

function ppro_setProjectItemsColor(labelIndex) {
    try {
        var changed = ppro_scanBin(app.project.rootItem, labelIndex);
        return changed > 0 ? "OK:" + changed : "NO_SEL";
    } catch (e) {
        return "ERR_PROJ:" + e.message;
    }
}

/**
 * Entry point for Premiere — applies to timeline clips AND project items.
 */
function ppro_applyColor(labelIndex) {
    var r1 = ppro_setTimelineClipColor(labelIndex);
    var r2 = ppro_setProjectItemsColor(labelIndex);
    if (r1.indexOf("OK") !== -1 || r2.indexOf("OK") !== -1) return "OK";
    return r1 + "|" + r2;
}

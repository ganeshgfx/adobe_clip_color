/* ================================================================
   host.jsx — ExtendScript for Clip Color Changer
   
   AFTER EFFECTS: Full label API — layer.label and item.label
   
   PREMIERE PRO: Two-step approach for timeline clips:
     1. setColorLabel() on the clip's source ProjectItem
     2. Attempt to enable "Show Source Clip Name and Label" so the
        timeline reflects source label colors.
   
   Also handles Project panel items directly.
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
    for (var i = 0; i < layers.length; i++) layers[i].label = labelIndex;
    app.endUndoGroup();
    return "OK:" + layers.length;
}

function ae_setSelectedProjectItemsColor(labelIndex) {
    var items = app.project.selection;
    if (!items || items.length === 0) return "NO_SEL_PROJ";
    app.beginUndoGroup("Clip Color Changer");
    for (var i = 0; i < items.length; i++) items[i].label = labelIndex;
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
 * Read Premiere Pro's keyboard shortcut file (.kys) to find the
 * "Show Source Clip Name and Label" toggle command ID.
 * Also reads label color command IDs if available.
 * Returns a JSON string: { toggleId: N, labelIds: [...] }
 */
function ppro_readKysInfo() {
    var result = { toggleId: -1, labelIds: [] };

    try {
        // Get all .kys files in the Settings/keyboard directory
        var appPath = app.path;
        if (appPath.slice(-1) !== "/" && appPath.slice(-1) !== "\\") appPath += "/";
        var kybDir = new Folder(appPath + "Settings/keyboard");

        if (!kybDir.exists) return JSON.stringify(result);

        var kybFiles = kybDir.getFiles("*.kys");
        if (!kybFiles || kybFiles.length === 0) return JSON.stringify(result);

        // Read the first (usually only) .kys file
        var f = kybFiles[0];
        f.encoding = "UTF-8";
        f.open("r");
        var content = f.read();
        f.close();

        if (!content || content.length < 50) return JSON.stringify(result);

        // Parse line by line looking for relevant commands
        var lines = content.split(/\r\n|\r|\n/);

        // Names to search for "Show Source Clip Name and Label" toggle
        var TOGGLE_TERMS = [
            "ShowSourceClipNameAndLabel",
            "SourceClipNameAndLabel",
            "ShowSource",
            "LabelColor",
            "TrackLabelColor"
        ];

        // Premiere Pro label color command name patterns
        var LABEL_COLOR_TERMS = [
            "Label.NoLabel",  "Label.Violet",  "Label.Iris",
            "Label.Caribbean","Label.Lavender", "Label.Cerulean",
            "Label.Forest",   "Label.Rose",     "Label.Mango",
            "Label.Purple",   "Label.Blue",     "Label.Teal",
            "Label.Magenta",  "Label.Tan",      "Label.Green",
            "Label.Brown",    "Label.Yellow"
        ];

        var labelIds = new Array(17);
        for (var li = 0; li < 17; li++) labelIds[li] = -1;

        for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            var line = lines[lineIdx];

            // Extract numeric ID from this line
            var idMatch = line.match(/(?:cmdID|commandId|id)\s*=\s*"?(\d+)"?/i);
            if (!idMatch) continue;
            var cmdId = parseInt(idMatch[1]);

            // Check for label color entries
            for (var lci = 0; lci < LABEL_COLOR_TERMS.length; lci++) {
                if (line.indexOf(LABEL_COLOR_TERMS[lci]) !== -1) {
                    labelIds[lci] = cmdId;
                    break;
                }
            }

            // Check for toggle command
            for (var ti = 0; ti < TOGGLE_TERMS.length; ti++) {
                if (line.indexOf(TOGGLE_TERMS[ti]) !== -1) {
                    result.toggleId = cmdId;
                    break;
                }
            }
        }

        result.labelIds = labelIds;
    } catch (e) {
        result.error = e.message;
    }

    return JSON.stringify(result);
}

/**
 * Main Premiere Pro color apply function.
 *
 * STRATEGY:
 *  1. Find selected clips on the timeline via isSelected()
 *  2. Collect their unique source ProjectItems
 *  3. Call setColorLabel() on each ProjectItem
 *     → This changes the source item's color in the Project panel
 *     → AND updates timeline clips IF "Show Source Clip Name and Label" is on
 *  4. Also change any selected Project panel items
 *  5. Return counts so the JS side can show useful feedback
 */
function ppro_applyColor(labelIndex) {
    var timelineChanged = 0;
    var projectChanged  = 0;
    var errors          = [];

    /* ---- Step 1: Timeline clips via their source ProjectItems -- */
    try {
        var seq = app.project.activeSequence;
        if (seq) {
            var trackGroups = [seq.videoTracks, seq.audioTracks];
            var seenProjectItems = {}; // deduplicate by nodeId

            for (var g = 0; g < trackGroups.length; g++) {
                var trackList = trackGroups[g];
                for (var i = 0; i < trackList.numTracks; i++) {
                    var track = trackList[i];
                    for (var j = 0; j < track.clips.numItems; j++) {
                        var clip = track.clips[j];
                        try {
                            if (!clip.isSelected()) continue;
                            // Get the source ProjectItem
                            var pi = clip.projectItem;
                            if (!pi) continue;
                            // Deduplicate — one projectItem can have multiple clips
                            var nodeId = pi.nodeId || (pi.name + "_" + pi.type);
                            if (seenProjectItems[nodeId]) {
                                timelineChanged++;
                                continue;
                            }
                            seenProjectItems[nodeId] = true;
                            pi.setColorLabel(labelIndex);
                            timelineChanged++;
                        } catch (e) {
                            errors.push("clip:" + e.message);
                        }
                    }
                }
            }
        }
    } catch (e) {
        errors.push("seq:" + e.message);
    }

    /* ---- Step 2: Project panel items --------------------------- */
    try {
        var projChanged = ppro_scanBin(app.project.rootItem, labelIndex);
        projectChanged = projChanged;
    } catch (e) {
        errors.push("proj:" + e.message);
    }

    /* ---- Build result ------------------------------------------ */
    if (timelineChanged === 0 && projectChanged === 0) {
        return "NO_SEL";
    }
    return "OK|timeline:" + timelineChanged + "|project:" + projectChanged;
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
            } catch (e) {}
            try {
                if (item.children && item.children.numItems > 0) {
                    changed += ppro_scanBin(item, labelIndex);
                }
            } catch (e) {}
        }
    } catch (e) {}
    return changed;
}

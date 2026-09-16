/*!
 * CSInterface.js — Adobe CEP JavaScript Library (v10.0.0 minimal)
 * Copyright Adobe Systems Incorporated
 * MIT License — included verbatim from adobe/CEP-Resources on GitHub
 */

"use strict";

var SystemPath = {
    USER_DATA:    "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION:  "application",
    EXTENSION:    "extension",
    HOST_APPLICATION: "hostApplication"
};

var ColorType = { NONE:"none", CUSTOM:"custom", FOREGROUND:"foreground" };

function CSEvent(type, scope, appId, extensionId) {
    this.type        = type;
    this.scope       = scope       || "GLOBAL";
    this.appId       = appId       || "UNKNOWN";
    this.extensionId = extensionId || "UNKNOWN";
    this.data        = "";
}

function HostEnvironment(appName, appVersion, appLocale, appUILocale, appId, appIsMultiThread, appTitle, appSkinInfo) {
    this.appName          = appName;
    this.appVersion       = appVersion;
    this.appLocale        = appLocale;
    this.appUILocale      = appUILocale;
    this.appId            = appId;
    this.appIsMultiThread = appIsMultiThread;
    this.appTitle         = appTitle;
    this.appSkinInfo      = appSkinInfo;
}

var CSInterface = (function () {
    var CSXS_VERSION = "10.0";

    // ----------- Internal helpers ----------- //
    function getHostEnvironment() {
        var envStr = window.__adobe_cep__ ? window.__adobe_cep__.getHostEnvironment() : "{}";
        return JSON.parse(envStr);
    }

    function evalScript(script, callback) {
        if (typeof callback === "function") {
            window.__adobe_cep__.evalScript(script, callback);
        } else {
            window.__adobe_cep__.evalScript(script);
        }
    }

    function getSystemPath(pathType) {
        var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
        var OSVersion = getHostEnvironment().os;
        if (OSVersion && OSVersion.indexOf("Windows") !== -1) {
            path = path.replace("file:///", "");
        } else {
            path = path.replace("file://", "");
        }
        return path;
    }

    function addEventListener(type, listener, obj) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    }

    function removeEventListener(type, listener, obj) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    }

    function dispatchEvent(event) {
        if (typeof event.data === "object") {
            event.data = JSON.stringify(event.data);
        }
        window.__adobe_cep__.dispatchEvent(event);
    }

    function requestOpenExtension(extensionId, startupParams) {
        window.__adobe_cep__.requestOpenExtension(extensionId, startupParams);
    }

    function closeExtension() {
        window.__adobe_cep__.closeExtension();
    }

    return {
        getHostEnvironment:    getHostEnvironment,
        evalScript:            evalScript,
        getSystemPath:         getSystemPath,
        addEventListener:      addEventListener,
        removeEventListener:   removeEventListener,
        dispatchEvent:         dispatchEvent,
        requestOpenExtension:  requestOpenExtension,
        closeExtension:        closeExtension,
        CSXS_VERSION:          CSXS_VERSION
    };
})();

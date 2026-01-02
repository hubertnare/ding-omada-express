/**
 * DING Technologies - WiFi Portal JavaScript
 * Omada OC200 Compatible - Uses AJAX JSON like official template
 */

// ==========================================
// VOUCHER APP CONFIGURATION
// ==========================================
var VOUCHER_APP_URL = 'https://ding-tech.netlify.app';

// ==========================================
// AJAX HELPER - Standard Omada Pattern
// ==========================================
var Ajax = {
    post: function (url, data, fn) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
                fn.call(this, xhr.responseText);
            }
        };
        xhr.send(data);
    }
};

// ==========================================
// GLOBAL VARIABLES - Standard Omada Pattern
// ==========================================
var data = {};
var globalConfig = {};
var submitUrl;
var clientMac = getQueryStringKey("clientMac");
var apMac = getQueryStringKey("apMac");
var gatewayMac = getQueryStringKey("gatewayMac") || undefined;
var ssidName = getQueryStringKey("ssidName") || undefined;
var radioId = !!getQueryStringKey("radioId") ? Number(getQueryStringKey("radioId")) : undefined;
var vid = !!getQueryStringKey("vid") ? Number(getQueryStringKey("vid")) : undefined;
var originUrl = getQueryStringKey("originUrl");
var previewSite = getQueryStringKey("previewSite");
var isCommited = false;

// ==========================================
// HOTSPOT TYPE MAPPING
// ==========================================
var hotspotMap = {
    3: "Voucher Access",
    5: "Local User Access",
    6: "SMS Access",
    8: "RADIUS Access"
};

// ==========================================
// ERROR MESSAGE MAPPING - Standard Omada Codes
// ==========================================
var errorHintMap = {
    0: "Connected successfully!",
    "-1": "Connection failed. Please try again.",
    "-1001": "Invalid request parameters.",
    "-41500": "Invalid authentication type.",
    "-41501": "Authentication failed. Please check your credentials.",
    "-41502": "Voucher code is incorrect. Please check and try again.",
    "-41503": "This voucher has expired.",
    "-41504": "Voucher data limit exceeded.",
    "-41505": "Maximum users reached for this network.",
    "-41506": "Invalid authorization.",
    "-41507": "Daily authentication limit reached. Try again tomorrow.",
    "-41508": "User data limit exceeded.",
    "-41512": "User account has expired.",
    "-41513": "User account is disabled.",
    "-41514": "Invalid MAC address.",
    "-41515": "User quota exceeded.",
    "-41516": "Maximum users reached.",
    "-41517": "Incorrect password.",
    "-41518": "Network not found.",
    "-41519": "Invalid verification code.",
    "-41520": "Verification code expired.",
    "-41521": "Maximum users reached.",
    "-41522": "Code validation failed.",
    "-41523": "Failed to send verification code.",
    "-41524": "Username not found.",
    "-41525": "Incorrect password.",
    "-41526": "Invalid client.",
    "-41527": "Invalid user account.",
    "-41528": "Decryption failed.",
    "-41529": "Invalid username or password.",
    "-41530": "Server connection timeout.",
    "-41531": "WiFi data limit reached for this code.",
    "-41532": "Account data limit reached.",
    "-41533": "Invalid form request.",
    "-43408": "Invalid server configuration.",
    "-43409": "Invalid server credentials.",
    "-41538": "Voucher not yet active."
};

// ==========================================
// QUERY STRING PARSER - Standard Omada Pattern
// ==========================================
function getQueryStringKey(key) {
    return getQueryStringAsObject()[key];
}

function getQueryStringAsObject() {
    var b, cv, e, k, ma, sk, v, r = {},
        d = function (v) { return decodeURIComponent(v); },
        q = window.location.search.substring(1),
        s = /([^&;=]+)=?([^&;]*)/g;
    
    ma = function(v) {
        if (typeof v != "object") {
            cv = v;
            v = {};
            v.length = 0;
            if (cv) { Array.prototype.push.call(v, cv); }
        }
        return v;
    };
    
    while (e = s.exec(q)) {
        b = e[1].indexOf("[");
        v = d(e[2]);
        if (b < 0) {
            k = d(e[1]);
            if (r[k]) {
                r[k] = ma(r[k]);
                Array.prototype.push.call(r[k], v);
            } else {
                r[k] = v;
            }
        } else {
            k = d(e[1].slice(0, b));
            sk = d(e[1].slice(b + 1, e[1].indexOf("]", b)));
            r[k] = ma(r[k]);
            if (sk) { r[k][sk] = v; }
            else { Array.prototype.push.call(r[k], v); }
        }
    }
    return r;
}

// ==========================================
// VOUCHER PURCHASE REDIRECT
// ==========================================
function redirectToBuyVoucher() {
    // IMPORTANT: Preserve the *exact* captive-portal URL and query string.
    // Omada includes critical parameters (e.g. site/t/redirectUrl) that are not safe to reconstruct.
    var portalReturnUrl = window.location.href.split('#')[0];
    console.log('[Portal] Redirecting to buy voucher. returnUrl:', portalReturnUrl);

    window.location.href = VOUCHER_APP_URL + '?returnUrl=' + encodeURIComponent(portalReturnUrl) + '&mode=voucher';
}

// ==========================================
// SHOW ERROR/HINT MESSAGE
// ==========================================
function showHint(message, type) {
    var hint = document.getElementById('oper-hint');
    var errorTips = document.getElementById('error-tips');
    if (hint) {
        hint.innerHTML = message;
        hint.style.display = 'block';
        if (type === 'success') {
            hint.style.color = '#00a854';
        } else {
            hint.style.color = '';
        }
    }
    if (errorTips && type !== 'success') {
        errorTips.innerHTML = message;
        errorTips.style.display = 'block';
    }
}

// ==========================================
// VOUCHER CODE NORMALIZER
// - Keeps visible characters intact
// - Removes hidden/invisible unicode marks
// - Safely decodes URL-encoded strings (if double-encoded)
// ==========================================
function normalizeVoucherCode(code) {
    if (code === undefined || code === null) return '';

    var s = String(code);

    // Sometimes values are URL-encoded more than once; decode safely.
    try {
        for (var i = 0; i < 2; i++) {
            // Also treat '+' as space (URLSearchParams-style encoding)
            var dec = decodeURIComponent(String(s).replace(/\+/g, '%20'));
            if (dec === s) break;
            s = dec;
        }
    } catch (e) {
        // ignore
    }

    // Normalize NBSP and remove common invisible/bidi characters.
    s = s.replace(/\u00A0/g, ' ');
    s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F\u202A-\u202E]/g, '');

    // Remove ALL whitespace (copy/paste often strips these; autofil may preserve them)
    s = s.replace(/\s+/g, '');

    // Our vouchers are numeric; if there are no letters, keep digits only.
    if (!/[A-Za-z]/.test(s)) {
        return s.replace(/\D/g, '');
    }

    // Otherwise keep only alphanumerics.
    return s.replace(/[^0-9A-Za-z]/g, '');
}


// ==========================================
// MAIN PORTAL INITIALIZATION - Standard Omada Pattern
// ==========================================
Ajax.post(
    '/portal/getPortalPageSetting',
    JSON.stringify({
        "clientMac": clientMac,
        "apMac": apMac,
        "gatewayMac": gatewayMac,
        "ssidName": ssidName,
        "radioId": radioId,
        "vid": vid,
        "originUrl": originUrl
    }),
    function (res) {
        res = JSON.parse(res);
        data = res.result || {};
        submitUrl = "/portal/auth";
        var landingUrl = data.landingUrl || originUrl || 'http://www.google.com';
        isCommited = false;
        
        globalConfig = {
            authType: data.authType || 11,
            hotspotTypes: (data.hotspot && data.hotspot.enabledTypes) || [3],
            error: data.error || 'ok',
            countryCode: (data.sms && data.sms.countryCode) || 263
        };

        // ==========================================
        // HANDLE SUBMIT - AJAX JSON (like working template)
        // ==========================================
        function handleSubmit() {
            var submitData = {};
            submitData["authType"] = window.authType;
            
            switch (window.authType) {
                case 3: // VOUCHER
                    var rawCode = document.getElementById("voucherCode").value;
                    var normalizedCode = normalizeVoucherCode(rawCode);
                    submitData["voucherCode"] = normalizedCode;
                    console.log('[Portal] Voucher submit:', {
                        raw: rawCode,
                        normalized: normalizedCode,
                        rawLen: String(rawCode).length,
                        normalizedLen: normalizedCode.length
                    });
                    break;
                case 5: // LOCAL USER
                    submitData["localuser"] = document.getElementById("username").value;
                    submitData["localuserPsw"] = document.getElementById("password").value;
                    break;
                case 1: // SIMPLE PASSWORD
                    submitData["simplePassword"] = document.getElementById("simplePassword").value;
                    break;
                case 0: // NO AUTH
                    break;
                case 6: // SMS
                    submitData["phone"] = "+" + document.getElementById("country-code").value + document.getElementById("phone-number").value;
                    submitData["code"] = document.getElementById("verify-code").value;
                    break;
                case 2: // EXTERNAL RADIUS
                case 8: // RADIUS
                    submitData["username"] = document.getElementById("username").value;
                    submitData["password"] = document.getElementById("password").value;
                    break;
                default:
                    break;
            }
            
            if (isCommited === false) {
                // Add client/network parameters
                submitData["clientMac"] = clientMac;
                submitData["apMac"] = apMac;
                submitData["gatewayMac"] = gatewayMac;
                submitData["ssidName"] = ssidName;
                submitData["radioId"] = radioId;
                submitData["vid"] = vid;
                
                // Set correct endpoint for RADIUS
                if (window.authType === 2 || window.authType === 8) {
                    submitUrl = "/portal/radius/auth";
                    submitData["authType"] = window.authType;
                } else {
                    submitData["originUrl"] = originUrl;
                }
                
                console.log('[Portal] Submitting to:', submitUrl, 'Data:', JSON.stringify(submitData));
                
                function doAuth() {
                    Ajax.post(submitUrl, JSON.stringify(submitData).toString(), function(response) {
                        response = JSON.parse(response);
                        console.log('[Portal] Auth response:', response);
                        
                        if (!!response && response.errorCode === 0) {
                            isCommited = true;
                            showHint('Connected successfully! Redirecting...', 'success');
                            // Redirect to landing page
                            setTimeout(function() {
                                window.location.href = landingUrl || originUrl || 'http://www.google.com';
                            }, 1000);
                        } else {
                            var errorMsg = errorHintMap[response.errorCode] || ('Error: ' + response.errorCode + ' - ' + (response.msg || 'Authentication failed'));
                            showHint(errorMsg);
                            document.getElementById("error-tips").innerHTML = errorMsg;
                            document.getElementById("error-tips").style.display = "block";
                        }
                    });
                }
                doAuth();
            }
        }

        // ==========================================
        // PAGE CONFIG PARSER
        // ==========================================
        function pageConfigParse() {
            if (res.errorCode !== 0) {
                document.getElementById("oper-hint").style.display = "block";
                document.getElementById("oper-hint").innerHTML = errorHintMap[res.errorCode] || 'An error occurred.';
            }
            
            // Hide all input sections initially
            document.getElementById("hotspot-section").style.display = "none";
            document.getElementById("input-voucher").style.display = "none";
            document.getElementById("input-user").style.display = "none";
            document.getElementById("input-password").style.display = "none";
            document.getElementById("input-simple").style.display = "none";
            document.getElementById("input-phone-num").style.display = "none";
            document.getElementById("input-verify-code").style.display = "none";
            
            switch (globalConfig.authType) {
                case 0: // NO_AUTH
                    window.authType = 0;
                    break;
                case 1: // SIMPLE_PASSWORD
                    document.getElementById("input-simple").style.display = "block";
                    window.authType = 1;
                    break;
                case 2: // EXTERNAL_RADIUS
                    hotspotChange(2);
                    window.authType = 2;
                    break;
                case 11: // HOTSPOT
                    document.getElementById("hotspot-section").style.display = "block";
                    var options = "";
                    for (var i = 0; i < globalConfig.hotspotTypes.length; i++) {
                        options += '<option value="' + globalConfig.hotspotTypes[i] + '">' + hotspotMap[globalConfig.hotspotTypes[i]] + '</option>';
                    }
                    document.getElementById("hotspot-selector").innerHTML = options;
                    hotspotChange(globalConfig.hotspotTypes[0]);
                    window.authType = globalConfig.hotspotTypes[0];
                    break;
            }
            
            // Check for purchased voucher code AFTER page is configured
            checkForPurchasedVoucher();
        }

        // ==========================================
        // CHECK FOR PURCHASED VOUCHER ON RETURN
        // ==========================================
        function checkForPurchasedVoucher() {
            var purchasedCode = getQueryStringKey('voucherCode');
            var purchaseSuccess = getQueryStringKey('purchaseSuccess');
            
            console.log('[Portal] Checking for purchased voucher:', { purchasedCode: purchasedCode, purchaseSuccess: purchaseSuccess });
            
            if (purchasedCode && purchaseSuccess === 'true') {
                // Normalize the voucher code (removes invisible characters, trims, handles decoding)
                purchasedCode = normalizeVoucherCode(purchasedCode);

                console.log('[Portal] Found purchased voucher, auto-filling. Normalized code:', purchasedCode, 'Length:', purchasedCode.length);

                // FORCE voucher auth type
                window.authType = 3;
                
                // FORCE show hotspot section with voucher selected
                var hotspotSection = document.getElementById('hotspot-section');
                var hotspotSelector = document.getElementById('hotspot-selector');
                
                if (hotspotSection) {
                    hotspotSection.style.display = 'block';
                }
                
                // Add voucher option if not present and select it
                if (hotspotSelector) {
                    var hasVoucherOption = false;
                    for (var i = 0; i < hotspotSelector.options.length; i++) {
                        if (hotspotSelector.options[i].value === '3') {
                            hotspotSelector.selectedIndex = i;
                            hasVoucherOption = true;
                            break;
                        }
                    }
                    // If voucher option doesn't exist, add it
                    if (!hasVoucherOption) {
                        var opt = document.createElement('option');
                        opt.value = '3';
                        opt.text = 'Voucher Access';
                        hotspotSelector.add(opt);
                        hotspotSelector.value = '3';
                    }
                }
                
                // FORCE show voucher input, hide ALL others
                document.getElementById("input-voucher").style.display = "block";
                document.getElementById("input-user").style.display = "none";
                document.getElementById("input-password").style.display = "none";
                document.getElementById("input-phone-num").style.display = "none";
                document.getElementById("input-verify-code").style.display = "none";
                document.getElementById("input-simple").style.display = "none";
                document.getElementById("submit-btn").style.display = "block";
                
                // Fill voucher code into the input
                setTimeout(function() {
                    var voucherInput = document.getElementById('voucherCode');
                    if (voucherInput) {
                        var normalized = normalizeVoucherCode(purchasedCode);

                        // Use the native value setter (more reliable than direct assignment in some captive portals)
                        try {
                            var valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            valueSetter.call(voucherInput, normalized);
                        } catch (e) {
                            voucherInput.value = normalized;
                        }

                        voucherInput.setAttribute('value', normalized);

                        // Trigger events to mimic a real user paste/typing flow
                        voucherInput.focus();
                        voucherInput.dispatchEvent(new Event('input', { bubbles: true }));
                        voucherInput.dispatchEvent(new Event('change', { bubbles: true }));
                        try {
                            voucherInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
                        } catch (e) {
                            // ignore
                        }

                        console.log('[Portal] Voucher code filled:', voucherInput.value, 'Actual input value:', document.getElementById('voucherCode').value);
                        showHint('Voucher ready! Click Connect to get online.', 'success');
                    } else {
                        console.error('[Portal] voucherCode input not found!');
                    }
                }, 0);
            }
        }

        // ==========================================
        // HOTSPOT TYPE CHANGE HANDLER
        // ==========================================
        function hotspotChange(type) {
            document.getElementById("input-voucher").style.display = "none";
            document.getElementById("input-user").style.display = "none";
            document.getElementById("input-password").style.display = "none";
            document.getElementById("input-phone-num").style.display = "none";
            document.getElementById("input-verify-code").style.display = "none";
            document.getElementById("submit-btn").style.display = "block";
            window.authType = Number(type);
            
            switch (Number(type)) {
                case 3: // VOUCHER
                    document.getElementById("input-voucher").style.display = "block";
                    break;
                case 5: // LOCAL_USER
                case 2: // EXTERNAL_RADIUS
                case 8: // RADIUS
                    document.getElementById("input-user").style.display = "block";
                    document.getElementById("input-password").style.display = "block";
                    break;
                case 6: // SMS
                    document.getElementById("input-phone-num").style.display = "block";
                    document.getElementById("input-verify-code").style.display = "block";
                    break;
            }
        }
        
        // Set country code
        globalConfig.countryCode = "+" + parseInt(globalConfig.countryCode, 10);
        var countryCodeEl = document.getElementById("country-code");
        if (countryCodeEl) {
            countryCodeEl.value = parseInt(globalConfig.countryCode, 10);
        }
        
        // ==========================================
        // EVENT LISTENERS
        // ==========================================
        document.getElementById("hotspot-selector").addEventListener("change", function() {
            var obj = document.getElementById("hotspot-selector");
            var opt = obj.options[obj.selectedIndex];
            hotspotChange(opt.value);
        });
        
        // Submit button - use AJAX, NOT form submission
        document.getElementById("submit-btn").addEventListener("click", function(e) {
            e.preventDefault();
            handleSubmit();
        });
        
        // Also handle form submit event
        document.getElementById("login-form").addEventListener("submit", function(e) {
            e.preventDefault();
            handleSubmit();
        });
        
        // Buy voucher button
        document.getElementById("buy-voucher-btn").addEventListener("click", redirectToBuyVoucher);
        
        // SMS code button
        document.getElementById("get-code").addEventListener("click", function(e) {
            e.preventDefault();
            var phoneNum = document.getElementById("phone-number").value;
            
            Ajax.post("/portal/sendSmsAuthCode",
                JSON.stringify({
                    clientMac: clientMac,
                    apMac: apMac,
                    gatewayMac: gatewayMac,
                    ssidName: ssidName,
                    radioId: radioId,
                    vid: vid,
                    phone: "+" + document.getElementById("country-code").value + phoneNum
                }), function(response) {
                    response = JSON.parse(response);
                    if (response.errorCode !== 0) {
                        showHint(errorHintMap[response.errorCode] || 'Failed to send code.');
                    } else {
                        showHint("Verification code sent!", 'success');
                    }
                }
            );
        });
        
        // Initialize page
        pageConfigParse();
    }
);

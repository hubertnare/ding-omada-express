/**
 * DING Technologies - WiFi Portal JavaScript
 * Omada OC200 Compatible - Follows official demo template pattern
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
var isCommited;

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
    "0": "Connected successfully!",
    "-1": "Connection failed. Please try again.",
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
    var returnParams = [];
    if (clientMac) returnParams.push('clientMac=' + encodeURIComponent(clientMac));
    if (apMac) returnParams.push('apMac=' + encodeURIComponent(apMac));
    if (gatewayMac) returnParams.push('gatewayMac=' + encodeURIComponent(gatewayMac));
    if (ssidName) returnParams.push('ssidName=' + encodeURIComponent(ssidName));
    if (radioId !== undefined) returnParams.push('radioId=' + encodeURIComponent(radioId));
    if (vid !== undefined) returnParams.push('vid=' + encodeURIComponent(vid));
    if (originUrl) returnParams.push('originUrl=' + encodeURIComponent(originUrl));
    
    var portalReturnUrl = window.location.origin + window.location.pathname + '?' + returnParams.join('&');
    window.location.href = VOUCHER_APP_URL + '?returnUrl=' + encodeURIComponent(portalReturnUrl) + '&mode=voucher';
}

// ==========================================
// CHECK FOR PURCHASED VOUCHER ON RETURN
// ==========================================
function checkForPurchasedVoucher() {
    var purchasedCode = getQueryStringKey('voucherCode');
    var purchaseSuccess = getQueryStringKey('purchaseSuccess');
    
    console.log('[Portal] Checking for purchased voucher:', { purchasedCode: purchasedCode, purchaseSuccess: purchaseSuccess });
    
    if (purchasedCode && purchaseSuccess === 'true') {
        console.log('[Portal] Found purchased voucher, setting up UI...');
        
        // Switch to voucher auth type and show voucher input
        var hotspotSelector = document.getElementById('hotspot-selector');
        if (hotspotSelector) {
            // Find and select the voucher option (type 3)
            for (var i = 0; i < hotspotSelector.options.length; i++) {
                if (hotspotSelector.options[i].value === '3') {
                    hotspotSelector.selectedIndex = i;
                    console.log('[Portal] Selected voucher option in dropdown');
                    break;
                }
            }
        }
        
        // Force show voucher input section
        var inputVoucher = document.getElementById("input-voucher");
        if (inputVoucher) {
            inputVoucher.style.display = "block";
            console.log('[Portal] Showing voucher input section');
        }
        document.getElementById("input-user").style.display = "none";
        document.getElementById("input-password").style.display = "none";
        document.getElementById("input-phone-num").style.display = "none";
        document.getElementById("input-verify-code").style.display = "none";
        window.authType = 3; // Set to voucher auth type
        
        // Fill in the voucher code - use setTimeout to ensure DOM is ready
        setTimeout(function() {
            var voucherInput = document.getElementById('voucherCode');
            console.log('[Portal] Looking for voucherCode input:', voucherInput);
            if (voucherInput) {
                voucherInput.value = purchasedCode;
                voucherInput.classList.add('success');
                console.log('[Portal] Set voucher code value to:', purchasedCode);
                showHint('Voucher purchased! Click Connect to get online.', 'success');
            } else {
                console.error('[Portal] Could not find voucherCode input element!');
            }
        }, 100);
    }
}

// ==========================================
// SHOW HINT MESSAGE
// ==========================================
function showHint(message, type) {
    var hint = document.getElementById('oper-hint');
    if (hint) {
        hint.innerHTML = message;
        hint.style.display = 'block';
        hint.className = 'oper-hint' + (type === 'success' ? ' success' : '');
    }
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
        data = res.result;
        submitUrl = "/portal/auth";
        var landingUrl = data.landingUrl;
        isCommited = false;
        
        globalConfig = {
            authType: data.authType,
            hotspotTypes: !!data.hotspot && data.hotspot.enabledTypes || [],
            error: data.error || 'ok',
            countryCode: !!data.sms && data.sms.countryCode || 263
        };

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
                case 15: // EXTERNAL_LDAP
                    hotspotChange(15);
                    window.authType = 15;
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
            
            // Check for purchased voucher code
            checkForPurchasedVoucher();
        }

        // ==========================================
        // POPULATE HIDDEN FORM FIELDS
        // ==========================================
        function populateHiddenFields() {
            document.getElementById('clientMacField').value = clientMac || '';
            document.getElementById('apMacField').value = apMac || '';
            document.getElementById('gatewayMacField').value = gatewayMac || '';
            document.getElementById('ssidNameField').value = ssidName || '';
            document.getElementById('radioIdField').value = radioId !== undefined ? radioId : '';
            document.getElementById('vidField').value = vid !== undefined ? vid : '';
            document.getElementById('originUrlField').value = originUrl || '';
            console.log('[Portal] Hidden fields populated');
        }
        
        // Populate hidden fields on load
        populateHiddenFields();

        // ==========================================
        // HANDLE FORM SUBMIT - Native Form Submission
        // ==========================================
        document.getElementById('login-form').addEventListener('submit', function(e) {
            if (isCommited) {
                e.preventDefault();
                return false;
            }
            
            // Update authType hidden field
            document.getElementById('authTypeField').value = window.authType;
            
            // For RADIUS/LDAP, change form action
            if (window.authType === 2 || window.authType === 8) {
                this.action = '/portal/radius/auth';
            } else if (window.authType === 15) {
                this.action = '/portal/ldap/auth';
            } else {
                this.action = '/portal/auth';
            }
            
            console.log('[Portal] Submitting form to:', this.action, 'authType:', window.authType);
            isCommited = true;
            
            // Let the form submit naturally
            return true;
        });

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
                case 15: // LDAP
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
        document.getElementById("country-code").value = parseInt(globalConfig.countryCode, 10);
        
        // ==========================================
        // EVENT LISTENERS - Standard Omada Pattern
        // ==========================================
        document.getElementById("hotspot-selector").addEventListener("change", function() {
            var obj = document.getElementById("hotspot-selector");
            var opt = obj.options[obj.selectedIndex];
            hotspotChange(opt.value);
        });
        
        // Form submission is now handled by the submit event listener above
        // Buy voucher button
        document.getElementById("buy-voucher-btn").addEventListener("click", redirectToBuyVoucher);
        
        // SMS code button
        document.getElementById("get-code").addEventListener("click", function(e) {
            e.preventDefault();
            var phoneNum = document.getElementById("phone-number").value;
            
            function sendSmsAuthCode() {
                Ajax.post("/portal/sendSmsAuthCode",
                    JSON.stringify({
                        clientMac: clientMac,
                        apMac: apMac,
                        gatewayMac: gatewayMac,
                        ssidName: ssidName,
                        radioId: radioId,
                        vid: vid,
                        phone: "+" + document.getElementById("country-code").value + phoneNum
                    }), function(data) {
                        data = JSON.parse(data);
                        if (data.errorCode !== 0) {
                            document.getElementById("oper-hint").style.display = "block";
                            document.getElementById("oper-hint").innerHTML = errorHintMap[data.errorCode] || 'Failed to send code.';
                        } else {
                            document.getElementById("oper-hint").style.display = "block";
                            document.getElementById("oper-hint").innerHTML = "Verification code sent!";
                            document.getElementById("oper-hint").className = 'oper-hint success';
                        }
                    }
                );
            }
            sendSmsAuthCode();
            document.getElementById("oper-hint").style.display = "block";
            document.getElementById("oper-hint").innerHTML = "Sending code...";
        });
        
        // Initialize page
        pageConfigParse();
    }
);

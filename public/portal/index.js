/**
 * DING Technologies - WiFi Portal JavaScript
 * Handles OMADA controller authentication with custom branding
 */

// Authentication type constants
var NO_AUTH = 0,
    SIMPLE_PASSWORD = 1,
    EXTERNAL_RADIUS = 2,
    HOTSPOT = 11,
    EXTERNAL_LDAP = 15;

var VOUCHER_ACCESS_TYPE = 3,
    LOCAL_USER_ACCESS_TYPE = 5,
    SMS_ACCESS_TYPE = 6,
    RADIUS_ACCESS_TYPE = 8,
    FORM_AUTH_ACCESS_TYPE = 12;

var MAX_INPUT_LEN = 2000;

// ==========================================
// VOUCHER APP CONFIGURATION
// Update this URL to your deployed Netlify app
// ==========================================
var VOUCHER_APP_URL = 'https://ding-tech.netlify.app';

// Ajax helper
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

var data = {};
var globalConfig = {};
var submitUrl;
var clientMac = getQueryStringKey("clientMac");
var apMac = getQueryStringKey("apMac");
var gatewayMac = getQueryStringKey("gatewayMac") || undefined;
var ssidName = getQueryStringKey("ssidName") || undefined;
var radioId = !!getQueryStringKey("radioId")? Number(getQueryStringKey("radioId")) : undefined;
var vid = !!getQueryStringKey("vid")? Number(getQueryStringKey("vid")) : undefined;
var originUrl = getQueryStringKey("originUrl");
var previewSite = getQueryStringKey("previewSite");

var hotspotMap = {
    3: "Voucher Access",
    5: "Local User Access",
    6: "SMS Access",
    8: "RADIUS Access",
    12: "Form Auth Access"
};

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

var isCommited;
var formAuthController = useFormAuthController();

// ==========================================
// VOUCHER PURCHASE REDIRECT FLOW
// ==========================================
function redirectToBuyVoucher() {
    // Build the current portal URL with all OMADA parameters to return to
    var returnParams = new URLSearchParams();
    if (clientMac) returnParams.set('clientMac', clientMac);
    if (apMac) returnParams.set('apMac', apMac);
    if (gatewayMac) returnParams.set('gatewayMac', gatewayMac);
    if (ssidName) returnParams.set('ssidName', ssidName);
    if (radioId) returnParams.set('radioId', radioId);
    if (vid) returnParams.set('vid', vid);
    if (originUrl) returnParams.set('originUrl', originUrl);
    
    // Build the portal return URL
    var portalReturnUrl = window.location.origin + window.location.pathname + '?' + returnParams.toString();
    
    // Redirect to voucher app with return URL and voucher mode
    window.location.href = VOUCHER_APP_URL + '?returnUrl=' + encodeURIComponent(portalReturnUrl) + '&mode=voucher';
}

// Check if returning from voucher purchase with a code
function checkForPurchasedVoucher() {
    var purchasedCode = getQueryStringKey('voucherCode');
    var purchaseSuccess = getQueryStringKey('purchaseSuccess');
    
    if (purchasedCode && purchaseSuccess === 'true') {
        var voucherInput = document.getElementById('voucherCode');
        if (voucherInput) {
            voucherInput.value = purchasedCode;
            voucherInput.classList.add('success');
            
            // Show success message
            var successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.innerHTML = '<h3>✓ Voucher Purchased!</h3><p>Your voucher code has been filled in. Click Connect to get online.</p>';
            
            var operSection = document.querySelector('.oper-section');
            var hintEl = document.getElementById('oper-hint');
            if (operSection && hintEl) {
                operSection.insertBefore(successDiv, hintEl.nextSibling);
            }
        }
    }
}

function showHint(message, type) {
    var hint = document.getElementById('oper-hint');
    hint.innerHTML = message;
    hint.style.display = 'block';
    hint.className = type === 'success' ? 'success' : '';
}

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

// Initialize portal
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
            buttonText: data.portalCustomize.buttonText || 'Connect',
            formAuthButtonText: data.portalCustomize.formAuthButtonText || 'Take the Survey',
            formAuth: data.formAuth || {},
            error: data.error || 'ok',
            countryCode: !!data.sms && data.sms.countryCode || 263
        };

        function pageConfigParse() {
            if (res.errorCode !== 0) {
                showHint(errorHintMap[res.errorCode] || 'An error occurred.');
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
                case NO_AUTH:
                    window.authType = 0;
                    break;
                case SIMPLE_PASSWORD:
                    document.getElementById("input-simple").style.display = "block";
                    window.authType = 1;
                    break;
                case EXTERNAL_RADIUS:
                    hotspotChange(2);
                    window.authType = 2;
                    break;
                case EXTERNAL_LDAP:
                    hotspotChange(15);
                    window.authType = 15;
                    break;
                case HOTSPOT:
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

        function handleSubmit(e) {
            if (e) e.preventDefault();
            
            var submitData = {};
            submitData['authType'] = window.authType;
            
            switch (window.authType) {
                case 3:
                    submitData['voucherCode'] = document.getElementById("voucherCode").value;
                    break;
                case 5:
                    submitData['localuser'] = document.getElementById("username").value;
                    submitData['localuserPsw'] = document.getElementById("password").value;
                    break;
                case 1:
                    submitData['simplePassword'] = document.getElementById("simplePassword").value;
                    break;
                case 0:
                    break;
                case 6:
                    submitData['phone'] = "+" + document.getElementById("country-code").value + document.getElementById("phone-number").value;
                    submitData['code'] = document.getElementById("verify-code").value;
                    break;
                case 2:
                case 8:
                    submitData['username'] = document.getElementById("username").value;
                    submitData['password'] = document.getElementById("password").value;
                    break;
                case 15:
                    submitData['ldapUsername'] = document.getElementById("username").value;
                    submitData['ldapPassword'] = document.getElementById("password").value;
                    break;
                case FORM_AUTH_ACCESS_TYPE:
                    $.extend(submitData, formAuthController.getAuthData());
                default:
                    break;
            }

            if (isCommited == false) {
                submitData['clientMac'] = clientMac;
                submitData['apMac'] = apMac;
                submitData['gatewayMac'] = gatewayMac;
                submitData['ssidName'] = ssidName;
                submitData['radioId'] = radioId;
                submitData['vid'] = vid;
                
                if (window.authType == 2 || window.authType == 8 || window.authType === 15) {
                    if (window.authType === 15) {
                        submitUrl = '/portal/ldap/auth';
                    } else {
                        submitUrl = "/portal/radius/auth";
                    }
                    submitData['authType'] = window.authType;
                } else {
                    submitData['originUrl'] = originUrl;
                }
                
                function doAuth() {
                    // Show loading state
                    var submitBtn = document.getElementById("submit-btn");
                    var originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = 'Connecting...';
                    submitBtn.disabled = true;
                    submitBtn.classList.add('loading');
                    
                    Ajax.post(submitUrl, JSON.stringify(submitData).toString(), function(data) {
                        data = JSON.parse(data);
                        if (!!data && data.errorCode === 0) {
                            isCommited = true;
                            showHint('Connected successfully! Redirecting...', 'success');
                            landingUrl = data.result || landingUrl;
                            setTimeout(function() {
                                window.location.href = landingUrl;
                            }, 1000);
                        } else {
                            showHint(errorHintMap[data.errorCode] || 'Connection failed.');
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                            submitBtn.classList.remove('loading');
                        }
                    });
                }
                doAuth();
            }
        }

        function hotspotChange(type) {
            document.getElementById("input-voucher").style.display = "none";
            document.getElementById("input-user").style.display = "none";
            document.getElementById("input-password").style.display = "none";
            document.getElementById("input-phone-num").style.display = "none";
            document.getElementById("input-verify-code").style.display = "none";
            document.getElementById("submit-btn").style.display = "flex";
            window.authType = Number(type);
            
            switch (Number(type)) {
                case VOUCHER_ACCESS_TYPE:
                    document.getElementById("input-voucher").style.display = "block";
                    setNormalButton();
                    break;
                case LOCAL_USER_ACCESS_TYPE:
                case EXTERNAL_RADIUS:
                case RADIUS_ACCESS_TYPE:
                case EXTERNAL_LDAP:
                    document.getElementById("input-user").style.display = "block";
                    document.getElementById("input-password").style.display = "block";
                    setNormalButton();
                    break;
                case SMS_ACCESS_TYPE:
                    document.getElementById("input-phone-num").style.display = "block";
                    document.getElementById("input-verify-code").style.display = "block";
                    setNormalButton();
                    break;
                case FORM_AUTH_ACCESS_TYPE:
                    formAuthController.init(globalConfig);
                    break;
            }
        }
        
        function setNormalButton() {
            document.getElementById("submit-btn").innerHTML = globalConfig.buttonText || 'Connect';
        }

        globalConfig.countryCode = "+" + parseInt(globalConfig.countryCode, 10);
        document.getElementById("country-code").value = parseInt(globalConfig.countryCode, 10);
        
        // Event listeners
        document.getElementById("hotspot-selector").addEventListener("change", function() {
            var obj = document.getElementById("hotspot-selector");
            var opt = obj.options[obj.selectedIndex];
            hotspotChange(opt.value);
        });
        
        // Form submission
        document.getElementById("login-form").addEventListener("submit", function(e) {
            e.preventDefault();
            if (window.authType === FORM_AUTH_ACCESS_TYPE) {
                formAuthController.showFormAuth(globalConfig);
            } else {
                handleSubmit(e);
            }
        });
        
        $("#form-auth-submit").on("click", function() {
            formAuthController.submitFormAuth(handleSubmit);
        });
        
        $("#form-auth-close").on("click", function() {
            $('#form-auth-msg').hide();
        });
        
        document.getElementById("get-code").addEventListener("click", function(e) {
            e.preventDefault();
            var phoneNum = document.getElementById("phone-number").value;
            var btn = this;
            btn.innerHTML = 'Sending...';
            btn.disabled = true;
            
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
                        showHint(errorHintMap[data.errorCode] || 'Failed to send code.');
                    } else {
                        showHint("Verification code sent! Check your phone.", 'success');
                    }
                    btn.innerHTML = 'Get Code';
                    btn.disabled = false;
                }
            );
        });
        
        pageConfigParse();
    }
);

// Form Auth Utility Functions
function useFormAuthUtil() {
    function transferChoices(card) {
        var choices = [];
        $.each(card.choices, function(index, choice) {
            choices.push({
                value: index,
                text: choice
            });
        });
        if (card.others) {
            choices.push({
                value: choices.length,
                text: card.others
            });
        }
        return choices;
    }

    function getOthersHtml() {
        return '<div class="others-outer hidden"><input class="input" maxlength="' + MAX_INPUT_LEN + '" type="text" placeholder="Please specify" /></div>';
    }

    function getValidateHtml() {
        return '<div class="validate-outer hidden">This field cannot start with special characters + - @ =</div>';
    }

    function getRequiredHtml(text) {
        return '<span class="required' + (text ? '' : ' hidden') + '">' + (text || '') + '</span>';
    }

    function validInput(val) {
        return /^[^+\-@=]/.test(val);
    }

    return {
        transferChoices: transferChoices,
        getOthersHtml: getOthersHtml,
        getValidateHtml: getValidateHtml,
        getRequiredHtml: getRequiredHtml,
        validInput: validInput
    };
}

function useFormAuthController() {
    var util = useFormAuthUtil();
    var formAuthData = {};

    function init(config) {
        formAuthData = {};
    }

    function showFormAuth(config) {
        if (!config.formAuth || !config.formAuth.cards) return;
        
        var html = '';
        $.each(config.formAuth.cards, function(index, card) {
            html += renderCard(card, index);
        });
        
        $('#form-auth-title').text(config.formAuth.title || 'Survey');
        $('#form-auth-note').text(config.formAuth.note || '');
        $('#form-auth-content').html(html);
        $('#form-auth-msg').show();
        
        bindEvents();
    }

    function renderCard(card, index) {
        var html = '<div class="card-container" data-index="' + index + '">';
        html += '<div class="card-index">' + (index + 1) + '</div>';
        html += '<div class="card-item-outer">';
        html += '<div class="title">' + card.title + util.getRequiredHtml(card.required ? '*' : '') + '</div>';
        
        if (card.type === 'radio' || card.type === 'checkbox') {
            var choices = util.transferChoices(card);
            $.each(choices, function(i, choice) {
                html += '<div class="choice-outer">';
                html += '<label class="choice-item">';
                html += '<input type="' + card.type + '" name="card_' + index + '" value="' + choice.value + '" />';
                html += '<span class="choice-text">' + choice.text + '</span>';
                html += '</label>';
                html += '</div>';
            });
            if (card.others) {
                html += util.getOthersHtml();
            }
        } else if (card.type === 'text') {
            html += '<input type="text" class="input" maxlength="' + MAX_INPUT_LEN + '" placeholder="' + (card.placeholder || '') + '" />';
            html += util.getValidateHtml();
        }
        
        html += '</div></div>';
        return html;
    }

    function bindEvents() {
        $('#form-auth-content input[type="radio"], #form-auth-content input[type="checkbox"]').on('change', function() {
            var $container = $(this).closest('.card-container');
            var $othersOuter = $container.find('.others-outer');
            var isLastChoice = $(this).val() == $container.find('input[type="radio"], input[type="checkbox"]').last().val();
            
            if (isLastChoice && $(this).is(':checked')) {
                $othersOuter.removeClass('hidden');
            } else {
                $othersOuter.addClass('hidden');
            }
        });
    }

    function getAuthData() {
        var data = { formAuth: [] };
        
        $('#form-auth-content .card-container').each(function() {
            var $card = $(this);
            var cardData = {};
            
            var $checkedInputs = $card.find('input[type="radio"]:checked, input[type="checkbox"]:checked');
            if ($checkedInputs.length) {
                cardData.values = [];
                $checkedInputs.each(function() {
                    cardData.values.push($(this).val());
                });
                var $othersInput = $card.find('.others-outer input');
                if (!$card.find('.others-outer').hasClass('hidden') && $othersInput.val()) {
                    cardData.others = $othersInput.val();
                }
            }
            
            var $textInput = $card.find('input[type="text"]:not(.others-outer input)');
            if ($textInput.length && $textInput.val()) {
                cardData.text = $textInput.val();
            }
            
            data.formAuth.push(cardData);
        });
        
        return data;
    }

    function submitFormAuth(callback) {
        $('#form-auth-msg').hide();
        if (typeof callback === 'function') {
            callback();
        }
    }

    return {
        init: init,
        showFormAuth: showFormAuth,
        getAuthData: getAuthData,
        submitFormAuth: submitFormAuth
    };
}
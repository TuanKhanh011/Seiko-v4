'use strict';
if (global.Fca.Require.FastConfig.Config != 'default') {}
const Language = global.Fca.Require.languageFile.find((i) => i.Language == global.Fca.Require.FastConfig.Language).Folder.Index;
var utils = global.Fca.Require.utils,
    logger = global.Fca.Require.logger,
    fs = global.Fca.Require.fs,
    getText = global.Fca.getText,
    log = global.Fca.Require.log,
    logg = require(process.cwd()+'/main/utils/log.js').load,
  //  express = require("express")(),
   // { join } = require('path'),
    cheerio = require("cheerio"),
  //  { readFileSync, writeFileSync } = require('fs-extra'),
    Database = require("./Extra/Database"),
    readline = require("readline"),
    chalk = require("chalk"),
   // figlet = require("figlet"),
//  os = require("os"),
    deasync = require('deasync'),
    Security = require("./Extra/Security/Base"),
    { getAll, deleteAll } = require('./Extra/ExtraGetThread'),
    ws = require('ws');
log.maxRecordSize = 100;
var checkVerified = null;
const Boolean_Option = ['online','selfListen','listenEvents','updatePresence','forceLogin','autoMarkDelivery','autoMarkRead','listenTyping','autoReconnect','emitReady'];
function setOptions(globalOptions, options) {
    Object.keys(options).map(function(key) {
        switch (Boolean_Option.includes(key)) {
            case true: {
                globalOptions[key] = Boolean(options[key]);
                break;
            }
            case false: {
                switch (key) {
                    case 'pauseLog': {
                        if (options.pauseLog) log.pause();
                            else log.resume();
                        break;
                    }
                    case 'logLevel': {
                        log.level = options.logLevel;
                            globalOptions.logLevel = options.logLevel;
                        break;
                    }
                    case 'logRecordSize': {
                        log.maxRecordSize = options.logRecordSize;
                            globalOptions.logRecordSize = options.logRecordSize;
                        break;
                    }
                    case 'pageID': {
                        globalOptions.pageID = options.pageID.toString();
                        break;
                    }
                    case 'userAgent': {
                        globalOptions.userAgent = (options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
                        break;
                    }
                    case 'proxy': {
                        if (typeof options.proxy != "string") {
                            delete globalOptions.proxy;
                            utils.setProxy();
                        } else {
                            globalOptions.proxy = options.proxy;
                            utils.setProxy(globalOptions.proxy);
                        }
                        break;
                    }
                    default: {
                        log.warn("setOptions", "Unrecognized option given to setOptions: " + key);
                        break;
                    }
                }
                break;
            }
        }
    });
}
function buildAPI(globalOptions, html, jar, bypass_region) {
    var userID;
    var cookie = jar.getCookies("https://www.facebook.com");
    var maybeUser = cookie.filter(function(val) { return val.cookieString().split("=")[0] === "c_user"; });
    var maybeTiktik = cookie.filter(function(val) { return val.cookieString().split("=")[0] === "i_user"; });
    if (maybeUser.length === 0 && maybeTiktik.length === 0) {
        if (global.Fca.Require.FastConfig.AutoLogin) {
            return global.Fca.Require.logger.Warning(global.Fca.Require.Language.Index.AutoLogin, function() {
                global.Fca.Action('AutoLogin')
            });
        }
        else if (!global.Fca.Require.FastConfig.AutoLogin) {
            return global.Fca.Require.logger.Error(global.Fca.Require.Language.Index.ErrAppState);
        }
    } else {
        if (html.indexOf("/checkpoint/block/?next") > -1) log.warn("login", Language.CheckPointLevelI);
        if (maybeTiktik[0] && maybeTiktik[0].cookieString().includes('i_user')) {
            userID = maybeTiktik[0].cookieString().split("=")[1].toString();
        }
        else userID = maybeUser[0].cookieString().split("=")[1].toString();    
        process.env['UID'] = logg(`Đăng nhập tại ID: ${userID}`);
        try {
            clearInterval(checkVerified);
        } catch (e) {
            console.log(e);
        }
        var clientID = (Math.random() * 2147483648 | 0).toString(16);
        var CHECK_MQTT = {
            oldFBMQTTMatch: html.match(/irisSeqID:"(.+?)",appID:219994525426954,endpoint:"(.+?)"/),
            newFBMQTTMatch: html.match(/{"app_id":"219994525426954","endpoint":"(.+?)","iris_seq_id":"(.+?)"}/),
            legacyFBMQTTMatch: html.match(/(\["MqttWebConfig",\[\],{fbid:")(.+?)(",appID:219994525426954,endpoint:")(.+?)(",pollingEndpoint:")(.+?)(3790])/)
        }
        let Slot = Object.keys(CHECK_MQTT);
        var mqttEndpoint,region,irisSeqID;
        Object.keys(CHECK_MQTT).map(function(MQTT) {
            if (CHECK_MQTT[MQTT] && !region) {
                switch (Slot.indexOf(MQTT)) {
                    case 0: {
                        irisSeqID = CHECK_MQTT[MQTT][1];
                            mqttEndpoint = CHECK_MQTT[MQTT][2];
                            region = new URL(mqttEndpoint).searchParams.get("region").toUpperCase();
                        return;
                    }
                    case 1: {
                        irisSeqID = CHECK_MQTT[MQTT][2];
                            mqttEndpoint = CHECK_MQTT[MQTT][1].replace(/\\\//g, "/");
                            region = new URL(mqttEndpoint).searchParams.get("region").toUpperCase();
                        return;
                    }
                    case 2: {
                        mqttEndpoint = CHECK_MQTT[MQTT][4];
                            region = new URL(mqttEndpoint).searchParams.get("region").toUpperCase();
                        return;
                    }
                }
            return;
            }
        });   
        var ctx = {
            userID: userID,
            jar: jar,
            clientID: clientID,
            globalOptions: globalOptions,
            loggedIn: true,
            access_token: 'NONE',
            clientMutationId: 0,
            mqttClient: undefined,
            lastSeqId: irisSeqID,
            syncToken: undefined,
            mqttEndpoint: mqttEndpoint,
            region: region,
            firstListen: true,
            req_ID: 0,
            wsReqNumber: 0,
            wsTaskNumber: 0,
            callback_Task: {},
            tasks: new Map()
        };
        var api = {
            setOptions: setOptions.bind(null, globalOptions),
            getAppState: function getAppState() {
                return utils.getAppState(jar);
            }
        };
        if (region && mqttEndpoint) {} else {
            if (bypass_region) {
                logger.Normal(Language.NoAreaDataBypass);
            } else {
                api["htmlData"] = html;
            }
        }
        var defaultFuncs = utils.makeDefaults(html, userID, ctx);
        api.postFormData = function(url, body) {
            return defaultFuncs.postFormData(url, ctx.jar, body);
        };
        fs.readdirSync(__dirname + "/src").filter(f => f.endsWith(".js")).map(f => { 
            const mod = f.split('.').slice(0, -1).join('.');
            api[mod] = require(`./src/${f === 'getThreadInfo.js' && !global.Fca.Require.FastConfig.AntiGetInfo.AntiGetThreadInfo ? 'getThreadMain.js' : f === 'getUserInfo.js' && !global.Fca.Require.FastConfig.AntiGetInfo.AntiGetUserInfo ? 'getUserInfoMain.js' : f}`)(defaultFuncs, api, ctx);
        });        
        return {
            ctx,
            defaultFuncs, 
            api
        };
    }
}
function makeLogin(jar, email, password, loginOptions, callback, prCallback) {
    return function(res) {
        var html = res.body,$ = cheerio.load(html),arr = [];
        $("#login_form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
        arr = arr.filter(function(v) {
            return v.val && v.val.length;
        });
        var form = utils.arrToForm(arr);
            form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
            form.lgndim = Buffer.from("{\"w\":1440,\"h\":900,\"aw\":1440,\"ah\":834,\"c\":24}").toString('base64');
            form.email = email;
            form.pass = password;
            form.default_persistent = '0';
            form.locale = 'en_US';     
            form.timezone = '240';
            form.lgnjs = ~~(Date.now() / 1000);
        html.split("\"_js_").slice(1).map((val) => {
            jar.setCookie(utils.formatCookie(JSON.parse("[\"" + utils.getFrom(val, "", "]") + "]"), "facebook"),"https://www.facebook.com")
        });
        logger.Normal(Language.OnLogin);
        return utils
            .post("https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110", jar, form, loginOptions)
            .then(utils.saveCookies(jar))
            .then(function(/** @type {{ headers: any; }} */res) {
                var headers = res.headers;  
                if (!headers.location) throw { error: Language.InvaildAccount };

                // This means the account has login approvals turned on.
                if (headers.location.indexOf('https://www.facebook.com/checkpoint/') > -1) {
                    logger.Warning(Language.TwoAuth);
                    var nextURL = 'https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php';

                    return utils
                        .get(headers.location, jar, null, loginOptions)
                        .then(utils.saveCookies(jar))
                        .then(function(res) {
                            if (!Database().get('ThroughAcc')) {
                                Database().set('ThroughAcc', email);
                            }
                            else {
                                if (String((Database().get('ThroughAcc'))).replace(RegExp('"','g'), '') != String(email).replace(RegExp('"','g'), '')) {
                                    Database().set('ThroughAcc', email);
                                    if (Database().get('Through2Fa')) {
                                        Database().delete('Through2Fa');
                                    }
                                }
                            }
                            var html = res.body,$ = cheerio.load(html), arr = [];
                            $("form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
                            arr = arr.filter(v => { return v.val && v.val.length });
                            var form = utils.arrToForm(arr);
                            if (html.indexOf("checkpoint/?next") > -1) {
                                setTimeout(() => {
                                    checkVerified = setInterval((_form) => {}, 5000, {
                                        fb_dtsg: form.fb_dtsg,
                                        jazoest: form.jazoest,
                                        dpr: 1
                                    });
                                }, 2500);  
                                switch (global.Fca.Require.FastConfig.Login2Fa) {
                                    case true: {
                                        const question = question => {
                                            const rl = readline.createInterface({
                                                input: process.stdin,
                                                output: process.stdout
                                            });
                                            var done,answ;
                                                rl.question(question, answer => {
                                                    rl.close();
                                                    answ = answer;
                                                    done = true
                                                })
                                                deasync.loopWhile(function(){
                                                    return !done;
                                                });
                                            return answ;
                                        };
                                        try {
                                            const Old_Cookie = Database().get('Through2Fa');
                                                if (Old_Cookie) {
                                                    Old_Cookie.map(function(/** @type {{ key: string; value: string; expires: string; domain: string; path: string; }} */c) {
                                                        let str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
                                                        jar.setCookie(str, "http://" + c.domain);
                                                    });
                                                    let Form = utils.arrToForm(arr);
                                                        Form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
                                                        Form.lgndim = Buffer.from("{\"w\":1440,\"h\":900,\"aw\":1440,\"ah\":834,\"c\":24}").toString('base64');
                                                        Form.email = email;
                                                        Form.pass = password;
                                                        Form.default_persistent = '0';
                                                        Form.locale = 'en_US';
                                                        Form.timezone = '240';
                                                        Form.lgnjs = ~~(Date.now() / 1000);
                                                    return utils
                                                        .post("https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110", jar, Form, loginOptions)
                                                        .then(utils.saveCookies(jar))
                                                    .then(function(res) {
                                                            let headers = res.headers
                                                                if (!headers['set-cookie'][0].includes('deleted')) {
                                                                    logger.Warning(Language.ErrThroughCookies, function() {
                                                                        Database().delete('Through2Fa');
                                                                    });
                                                                    process.exit(1);
                                                                }
                                                            if (headers.location && headers.location.indexOf('https://www.facebook.com/checkpoint/') > -1) {
                                                                return utils
                                                                    .get(headers.location, jar, null, loginOptions)
                                                                    .then(utils.saveCookies(jar))
                                                                .then(function(res) {
                                                                    var html = res.body,$ = cheerio.load(html), arr = [];
                                                                    $("form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
                                                                    arr = arr.filter(v => { return v.val && v.val.length });
                                                                    var Form = utils.arrToForm(arr);

                                                                    if (html.indexOf("checkpoint/?next") > -1) {
                                                                        setTimeout(() => {
                                                                            checkVerified = setInterval((_form) => {}, 5000, {
                                                                                fb_dtsg: Form.fb_dtsg,
                                                                                jazoest: Form.jazoest,
                                                                                dpr: 1
                                                                            });
                                                                        }, 2500);

                                                                        if (!res.headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                            try {
                                                                                delete Form.name_action_selected;
                                                                                Form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                                return utils
                                                                                    .post(nextURL, jar, Form, loginOptions)
                                                                                    .then(utils.saveCookies(jar))
                                                                                    .then(function() {
                                                                                        Form['submit[This was me]'] = "This was me";
                                                                                        return utils.post(nextURL, jar, Form, loginOptions).then(utils.saveCookies(jar));
                                                                                    })
                                                                                    .then(function() {
                                                                                        delete Form['submit[This was me]'];
                                                                                        Form.name_action_selected = 'save_device';
                                                                                        Form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                                        return utils.post(nextURL, jar, Form, loginOptions).then(utils.saveCookies(jar));
                                                                                    })
                                                                                    .then(function(res) {
                                                                                        var headers = res.headers;
                                                                                        if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                                            Database().delete('Through2Fa');
                                                                                            process.exit(1);
                                                                                        }
                                                                                        var appState = utils.getAppState(jar,false);
                                                                                        Database().set('Through2Fa', appState);
                                                                                        return loginHelper(appState, email, password, loginOptions, callback);
                                                                                    })
                                                                                .catch((e) => callback(e));
                                                                            }
                                                                            catch (e) {
                                                                                console.log(e)
                                                                            }
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                        return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
                                                    })
                                                    .catch((e) => console.log(e));
                                                }
                                            }
                                        catch (e) {
                                            Database().delete('Through2Fa');
                                        }
                                        const Otp_code = require('totp-generator');
                                        const Code = global.Fca.Require.FastConfig.AuthString.includes('|') == false ? Otp_code(global.Fca.Require.FastConfig.AuthString.includes(" ") ? global.Fca.Require.FastConfig.AuthString.replace(RegExp(" ", 'g'), "") : global.Fca.Require.FastConfig.AuthString) :  question(Language.EnterSecurityCode); 
                                            try {
                                                const approvals = function(N_Code) { 
                                                    form.approvals_code = N_Code;
                                                    form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                    var prResolve,prReject;
                                                    var rtPromise = new Promise((resolve, reject) => { prResolve = resolve; prReject = reject; });

                                                    if (typeof N_Code == "string") {
                                                        utils
                                                            .post(nextURL, jar, form, loginOptions)
                                                            .then(utils.saveCookies(jar))
                                                        .then(function(res) {
                                                            var $ = cheerio.load(res.body);
                                                            var error = $("#approvals_code").parent().attr("data-xui-error");
                                                            if (error) {
                                                                logger.Warning(Language.InvaildTwoAuthCode,function() { approvals(question(Language.EnterSecurityCode)) }); //bruh loop
                                                            };
                                                        })
                                                        .then(function() {
                                                            delete form.no_fido;delete form.approvals_code;
                                                            form.name_action_selected = 'save_device'; //'save_device' || 'dont_save;
                                                            return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                        }) 
                                                        .then(function(res) {
                                                            var headers = res.headers;
                                                            if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                try {
                                                                    delete form.name_action_selected;
                                                                    form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                    return utils
                                                                        .post(nextURL, jar, form, loginOptions)
                                                                        .then(utils.saveCookies(jar))
                                                                        .then(function() {
                                                                            form['submit[This was me]'] = "This was me";
                                                                            return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                                        })
                                                                        .then(function() {
                                                                            delete form['submit[This was me]'];
                                                                            form.name_action_selected = 'save_device';
                                                                            form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                            return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                                        })
                                                                        .then(function(res) {
                                                                            var headers = res.headers;
                                                                            if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) throw { error: "wtf ??:D" };
                                                                            var appState = utils.getAppState(jar,false);
                                                                            Database().set('Through2Fa', appState);
                                                                            return loginHelper(appState, email, password, loginOptions, callback);
                                                                        })
                                                                    .catch((e) => callback(e));
                                                                }
                                                                catch (e) {
                                                                    console.log(e)
                                                                }
                                                            }
                                                            var appState = utils.getAppState(jar,false);
                                                            if (callback === prCallback) {
                                                                callback = function(err, api) {
                                                                    if (err) return prReject(err);
                                                                    return prResolve(api);
                                                                };
                                                            }
                                                            Database().set('Through2Fa', appState);
                                                            return loginHelper(appState, email, password, loginOptions, callback);
                                                        })
                                                        .catch(function(err) {
                                                                if (callback === prCallback) prReject(err);
                                                                else callback(err);
                                                        });
                                                    }
                                                    else {
                                                        utils
                                                            .post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, { "Referer": "https://www.facebook.com/checkpoint/?next" })
                                                            .then(utils.saveCookies(jar))
                                                        .then(function(res) {
                                                            try { 
                                                                JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
                                                            } catch (ex) {
                                                                clearInterval(checkVerified);
                                                                logger.Warning(Language.VerifiedCheck);
                                                                if (callback === prCallback) {
                                                                    callback = function(err, api) {
                                                                        if (err) return prReject(err);
                                                                        return prResolve(api);
                                                                    };
                                                                }
                                                                let appState = utils.getAppState(jar,false);
                                                                return loginHelper(appState, email, password, loginOptions, callback);
                                                            }
                                                        })
                                                        .catch((ex) => {
                                                            log.error("login", ex);
                                                            if (callback === prCallback) prReject(ex);
                                                            else callback(ex);
                                                        });
                                                    }
                                                    return rtPromise;
                                                }
                                                return approvals(Code)
                                            }
                                            catch (e) {
                                                logger.Error(e)
                                                logger.Error();
                                                process.exit(0);
                                            }
                                        } 
                                    case false: {
                                        throw {
                                            error: 'login-approval',
                                            continue: function submit2FA(code) {
                                                form.approvals_code = code;
                                                form['submit[Continue]'] = $("#checkpointSubmitButton").html(); //'Continue';
                                                var prResolve,prReject;
                                                var rtPromise = new Promise((resolve, reject) => { prResolve = resolve; prReject = reject; });
                                                if (typeof code == "string") {
                                                    utils
                                                        .post(nextURL, jar, form, loginOptions)
                                                        .then(utils.saveCookies(jar))
                                                        .then(function(/** @type {{ body: string | Buffer; }} */res) {
                                                            var $ = cheerio.load(res.body);
                                                            var error = $("#approvals_code").parent().attr("data-xui-error");
                                                            if (error) {
                                                                throw {
                                                                    error: 'login-approval',
                                                                    errordesc: Language.InvaildTwoAuthCode,
                                                                    lerror: error,
                                                                    continue: submit2FA
                                                                };
                                                            }
                                                        })
                                                        .then(function() {
                                                            delete form.no_fido;delete form.approvals_code;
                                                            form.name_action_selected = 'dont_save'; //'save_device' || 'dont_save;
                                                            return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                        })
                                                        .then(function(res) {
                                                            var headers = res.headers;
                                                            if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) throw { error: Language.ApprovalsErr };
                                                            var appState = utils.getAppState(jar,false);
                                                            if (callback === prCallback) {
                                                                callback = function(err, api) {
                                                                    if (err) return prReject(err);
                                                                    return prResolve(api);
                                                                };
                                                            }
                                                            return loginHelper(appState, email, password, loginOptions, callback);
                                                        })
                                                        .catch(function(err) {
                                                            if (callback === prCallback) prReject(err);
                                                            else callback(err);
                                                        });
                                                } else {
                                                    utils
                                                        .post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, { "Referer": "https://www.facebook.com/checkpoint/?next" })
                                                        .then(utils.saveCookies(jar))
                                                        .then((res) => {
                                                            try { 
                                                                JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
                                                            } catch (ex) {
                                                                clearInterval(checkVerified);
                                                                logger.Warning(Language.VerifiedCheck);
                                                                if (callback === prCallback) {
                                                                    callback = function(err, api) {
                                                                        if (err) return prReject(err);
                                                                        return prResolve(api);
                                                                    };
                                                                }
                                                                return loginHelper(utils.getAppState(jar,false), email, password, loginOptions, callback);
                                                            }
                                                        })
                                                        .catch((ex) => {
                                                            log.error("login", ex);
                                                            if (callback === prCallback) prReject(ex);
                                                            else callback(ex);
                                                        });
                                                    }
                                                return rtPromise;
                                            }
                                        };
                                    }
                                }
                            } else {
                                if (!loginOptions.forceLogin) throw { error: Language.ForceLoginNotEnable };

                                if (html.indexOf("Suspicious Login Attempt") > -1) form['submit[This was me]'] = "This was me";
                                else form['submit[This Is Okay]'] = "This Is Okay";

                                return utils
                                    .post(nextURL, jar, form, loginOptions)
                                    .then(utils.saveCookies(jar))
                                    .then(function() {
                                        form.name_action_selected = 'dont_save';

                                        return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                    })
                                    .then(function(res) {
                                        var headers = res.headers;

                                        if (!headers.location && res.body.indexOf('Review Recent Login') > -1) throw { error: "Something went wrong with review recent login." };

                                        var appState = utils.getAppState(jar,false);

                                        return loginHelper(appState, email, password, loginOptions, callback);
                                    })
                                    .catch((e) => callback(e));
                            }
                        });
                }
            return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
        });
    };
}
function backup(data,globalOptions, callback, prCallback) {
    try {
        var appstate;
        try {
            appstate = JSON.parse(data)
        }
        catch(e) {
            appstate = data;
        }
            logger.Warning(Language.BackupNoti);
        try {
            loginHelper(appstate,null,null,globalOptions, callback, prCallback)
        }
        catch (e) {
            logger.Error(Language.ErrBackup);
            process.exit(0);
        }
    }
    catch (e) {
        return logger.Error();
    }
}
function loginHelper(appState, email, password, globalOptions, callback, prCallback) {
    var mainPromise = null;
    var jar = utils.getJar();

try {
    if (appState) {
        logg('Tiến hành đăng nhập vào tài khoản');
            switch (Database().has("FBKEY")) {
                case true: {
                    process.env.FBKEY = Database().get("FBKEY");
                }
                    break;
                case false: {
                    const SecurityKey = global.Fca.Require.Security.create().apiKey;
                        process.env['FBKEY'] = SecurityKey;
                    Database().set('FBKEY', SecurityKey);
                }
                    break;
                default: {
                    const SecurityKey = global.Fca.Require.Security.create().apiKey;
                        process.env['FBKEY'] = SecurityKey;
                    Database().set('FBKEY', SecurityKey);
                }
            }
            try {
                switch (global.Fca.Require.FastConfig.EncryptFeature) {
                    case true: {
                        appState = JSON.parse(JSON.stringify(appState, null, "\t"));
                        switch (utils.getType(appState)) {
                            case "Array": {
                                switch (utils.getType(appState[0])) {
                                    case "Object": {
                                        logger.Normal(Language.NotReadyToDecrypt);
                                    }
                                        break;
                                    case "String": {
                                        appState = Security(appState,process.env['FBKEY'],'Decrypt');
                                        logger.Normal(Language.DecryptSuccess);
                                    }
                                        break;
                                    default: {
                                        logger.Warning(Language.InvaildAppState);
                                        process.exit(0)
                                    }
                                }
                            }
                                break;
                            default: {
                                logger.Warning(Language.InvaildAppState);
                                process.exit(0)
                            }
                        } 
                    }
                        break;
                    case false: {
                        switch (utils.getType(appState)) { 
                            case "Array": {
                                switch (utils.getType(appState[0])) {
                                    case "Object": {
                                    
                                    }
                                        break;
                                    case "String": {
                                        appState = Security(appState,process.env['FBKEY'],'Decrypt');
                                    
                                        logger.Normal(Language.DecryptSuccess);
                                    }
                                        break;
                                    default: {
                                        logger.Warning(Language.InvaildAppState);
                                        process.exit(0)
                                    }
                                }
                            }
                                break;
                            default: {
                                logger.Warning(Language.InvaildAppState);
                                process.exit(0)
                            }
                        } 
                    }
                        break;
                    default: {
                        logger.Warning(getText(Language.IsNotABoolean,global.Fca.Require.FastConfig.EncryptFeature))
                        process.exit(0);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }

        try {
            appState = JSON.parse(appState);
        }
        catch (e) {
            try {
                appState = appState;
            }
            catch (e) {
                return logger.Error();
            }
        }
        try {
            global.Fca.Data.AppState = appState;
                appState.map(function(c) {
                    var str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
                    jar.setCookie(str, "http://" + c.domain);
                });
                Database().set('Backup', appState);
            mainPromise = utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
        } 
        catch (e) {
            try {
                if (Database().has('Backup')) {
                    return backup(Database().get('Backup'),globalOptions, callback, prCallback);
                }
                else {
                    logger.Warning(Language.ErrBackup);
                    process.exit(0);
                }
            }
            catch (e) {
                logger.Warning(Language.ErrBackup);
                process.exit(0);
            }
        }
    } else {
    mainPromise = utils
        .get("https://www.facebook.com/", null, null, globalOptions, { noRef: true })
            .then(utils.saveCookies(jar))
            .then(makeLogin(jar, email, password, globalOptions, callback, prCallback))
            .then(function() {
                return utils.get('https://www.facebook.com/', jar, null, globalOptions).then(utils.saveCookies(jar));
            });
        }
    } catch (e) {
        console.log(e);
    }
    function CheckAndFixErr(res) {
        let reg_antierr = /This browser is not supported/gs;
        if (reg_antierr.test(res.body)) {
            const Data = JSON.stringify(res.body);
            const Dt_Check = Data.split('2Fhome.php&amp;gfid=')[1];
            if (Dt_Check == undefined) return res
            const fid = Dt_Check.split("\\\\")[0];
            if (Dt_Check == undefined || Dt_Check == "") return res
            const final_fid = fid.split(`\\`)[0];
            if (final_fid == undefined || final_fid == '') return res;
            const redirectlink = redirect[1] + "a/preferences.php?basic_site_devices=m_basic&uri=" + encodeURIComponent("https://m.facebook.com/home.php") + "&gfid=" + final_fid;
            bypass_region_err = true;
            return utils.get(redirectlink, jar, null, globalOptions).then(utils.saveCookies(jar));
        }
        else return res
    }

    function Redirect(res) {
        var reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
        redirect = reg.exec(res.body);
            if (redirect && redirect[1]) return utils.get(redirect[1], jar, null, globalOptions).then(utils.saveCookies(jar));
        return res;
    }
    let redirect = [1, "https://m.facebook.com/"];
    let bypass_region_err = false;
        var ctx,api;
            mainPromise = mainPromise
                .then(res => Redirect(res))
                .then(res => CheckAndFixErr(res))
                .then(function(res) {
                    let Regex_Via = /MPageLoadClientMetrics/gs;
                    if (!Regex_Via.test(res.body)) {
                        globalOptions.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
                        return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
                    }
                    else return res
                })
                .then(res => Redirect(res))
                .then(res => CheckAndFixErr(res))
                .then(function(res){
                    var html = res.body,Obj = buildAPI(globalOptions, html, jar,bypass_region_err);
                        ctx = Obj.ctx;
                        api = Obj.api;
                    return res;
                });
            if (globalOptions.pageID) {
                mainPromise = mainPromise
                    .then(function() {
                        return utils.get('https://www.facebook.com/' + ctx.globalOptions.pageID + '/messages/?section=messages&subsection=inbox', ctx.jar, null, globalOptions);
                    })
                    .then(function(resData) {
                        var url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
                        url = url.substring(0, url.length - 1);
                        return utils.get('https://www.facebook.com' + url, ctx.jar, null, globalOptions);
                    });
            }
        mainPromise
            .then(async() => {
                callback(null, api);
            }).catch(function(e) {
            log.error("login", e.error || e);
        callback(e);
    });
}

function setUserNameAndPassWord() {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.clear();
    try {
        rl.question(Language.TypeAccount, (Account) => {
            if (!Account.includes("@") && global.Fca.Require.utils.getType(parseInt(Account)) != "Number") return logger.Normal(Language.TypeAccountError, function () { process.exit(1) }); //Very Human
                else rl.question(Language.TypePassword, function (Password) {
                    rl.close();
                    try {
                        Database().set("Account", Account);
                        Database().set("Password", Password);
                    }
                    catch (e) {
                        logger.Warning(Language.ErrDataBase);
                            logger.Error();
                        process.exit(0);
                    }
                    if (global.Fca.Require.FastConfig.ResetDataLogin) {
                        global.Fca.Require.FastConfig.ResetDataLogin = false;
                        global.Fca.Require.fs.writeFileSync(process.cwd() + '/main/json/configfca.json', JSON.stringify(global.Fca.Require.FastConfig, null, 4));
                    }
                logger.Success(Language.SuccessSetData);
                process.exit(1);
            });
        })
    }
    catch (e) {
        logger.Error(e)
    }
}
function login(loginData, options, callback) {
    if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
        callback = options;
        options = {};
    }
    var globalOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: false,
        forceLogin: false,
        autoMarkDelivery: false,
        autoMarkRead: false,
        autoReconnect: true,
        logRecordSize: 100,
        online: false,
        emitReady: false,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8"
    };
    var prCallback = null;
    if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
        var rejectFunc = null;
        var resolveFunc = null;
        var returnPromise = new Promise(function(resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        }); 
        prCallback = function(error, api) {
            if (error) return rejectFunc(error);
            return resolveFunc(api);
        };
        callback = prCallback;
    }

    if (loginData.email && loginData.password) {
        setOptions(globalOptions, {
            logLevel: "silent",
            forceLogin: true,
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36"
        });
        loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
    } else if (loginData.appState) {
        setOptions(globalOptions, options);
        let All = (getAll()).filter(i => i.data.messageCount !== undefined);
            if (All.length >= 1) {
                deleteAll(All.map(obj => obj.data.threadID));
            }
        switch (global.Fca.Require.FastConfig.AutoLogin) {
            case true: {
                if (global.Fca.Require.FastConfig.ResetDataLogin) return setUserNameAndPassWord();
                else {
                    try {
                        const TempState = Database().get("TempState")
                        if (TempState) { 
                            try {
                                loginData.appState = JSON.parse(TempState);
                            }
                            catch (_) {
                                loginData.appState = TempState;
                            }
                            Database().delete("TempState");
                        }
                    }
                    catch (e) {
                        console.log(e)
                        Database().delete("TempState");
                            logger.Warning(Language.ErrDataBase);
                            logger.Error();
                        process.exit(0);
                    }
                    try {
                        if (Database().has('Account') && Database().has('Password')) return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
                        else return setUserNameAndPassWord();
                    }
                    catch (e) {
                        console.log(e)
                        logger.Warning(Language.ErrDataBase);
                            logger.Error();
                        process.exit(0);
                    }
                }
            }
            case false: {
                return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
            }
        }
    }
    return returnPromise;
}
module.exports = login;
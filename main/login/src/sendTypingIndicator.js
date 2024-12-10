"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  function makeTypingIndicator(typ, threadID, callback, isGroup) {
    var form = {
      typ: +typ,
      to: "",
      source: "mercury-chat",
      thread: threadID,
    };

    // Check if thread is a single person chat or a group chat
    // More info on this is in api.sendMessage
    if (utils.getType(isGroup) == "Boolean") {
      if (!isGroup) {
        form.to = threadID;
      }
      defaultFuncs
        .post("https://www.facebook.com/ajax/messaging/typ.php", ctx.jar, form)
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
        .then(function (resData) {
          if (resData.error) {
            throw resData;
          }

          return callback();
        })
        .catch(function (err) {
          log.error("sendTypingIndicator", err);
          if (utils.getType(err) == "Object" && err.error === "Not logged in") {
            ctx.loggedIn = false;
          }
          return callback(err);
        });
    } else {
      api.getUserInfo(threadID, function (err, res) {
        if (err) {
          return callback(err);
        }

        // If id is single person chat
        if (Object.keys(res).length > 0) {
          form.to = threadID;
        }

        defaultFuncs
          .post(
            "https://www.facebook.com/ajax/messaging/typ.php",
            ctx.jar,
            form,
          )
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) {
              throw resData;
            }

            return callback();
          })
          .catch(function (err) {
            log.error("sendTypingIndicator", err);
            if (
              utils.getType(err) == "Object" &&
              err.error === "Not logged in."
            ) {
              ctx.loggedIn = false;
            }
            return callback(err);
          });
      });
    }
  }

  function sendTypingIndicatorNoMqtt(threadID, callback, isGroup) {
    if (
      utils.getType(callback) !== "Function" &&
      utils.getType(callback) !== "AsyncFunction"
    ) {
      if (callback) {
        log.warn(
          "sendTypingIndicator",
          "callback is not a function - ignoring.",
        );
      }
      callback = () => {};
    }

    makeTypingIndicator(true, threadID, callback, isGroup);

    return function end(cb) {
      if (
        utils.getType(cb) !== "Function" &&
        utils.getType(cb) !== "AsyncFunction"
      ) {
        if (cb) {
          log.warn(
            "sendTypingIndicator",
            "callback is not a function - ignoring.",
          );
        }
        cb = () => {};
      }

      makeTypingIndicator(false, threadID, cb, isGroup);
    };
  }

  function sendTypingIndicatorMqtt(isTyping, threadID, callback) {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }

    ctx.wsReqNumber += 1;

    api
      .getThreadInfo(threadID)
      .then((threadData) => {
        const label = "3";
        const isGroupThread = threadData.isGroup ? 1 : 0;
        const attribution = 0;

        const taskPayload = {
          thread_key: threadID,
          is_group_thread: isGroupThread,
          is_typing: isTyping ? 1 : 0,
          attribution: attribution,
        };

        const payload = JSON.stringify(taskPayload);
        const version = "25393437286970779";

        const content = {
          app_id: "2220391788200892",
          payload: JSON.stringify({
            label: label,
            payload: payload,
            version: version,
          }),
          request_id: ctx.wsReqNumber,
          type: 4,
        };

        if (typeof callback == "function") {
          // to be implemented
        }

        ctx.mqttClient.publish("/ls_req", JSON.stringify(content), {
          qos: 1,
          retain: false,
        });
      })
      .catch((error) => {
        // console.error(error);
        // throw new Error("Failed to get thread info");
      });
  }

  return function sendTypingIndicator(threadID, callback, delay, isGroup) {
    if (ctx.mqttClient) {
      if (typeof callback !== "function") delay = callback;
      try {
        sendTypingIndicatorMqtt(true, threadID, callback);
        setTimeout(
          function () {
            sendTypingIndicatorMqtt(false, threadID, () => {});
          },
          delay ? delay : 30 * 1000,
        );
        callback();
      } catch (e) {
        // console.error(e);
        sendTypingIndicatorNoMqtt(threadID, callback, isGroup);
      }
    } else sendTypingIndicatorNoMqtt(threadID, callback, isGroup);
  };
};

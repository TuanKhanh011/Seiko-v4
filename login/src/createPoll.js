"use strict";

var utils = require("../utils");
var log = require("npmlog");
const { generateOfflineThreadingID } = require("../utils");

module.exports = function (defaultFuncs, api, ctx) {
  function createPollNoMqtt(title, threadID, options, callback) {
    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      if (utils.getType(options) == "Function") {
        callback = options;
        options = null;
      } else {
        callback = function (err) {
          if (err) {
            return rejectFunc(err);
          }
          resolveFunc();
        };
      }
    }
    if (!options) {
      options = {}; // Initial poll options are optional
    }

    var form = {
      target_id: threadID,
      question_text: title,
    };

    // Set fields for options (and whether they are selected initially by the posting user)
    var ind = 0;
    for (var opt in options) {
      // eslint-disable-next-line no-prototype-builtins
      if (options.hasOwnProperty(opt)) {
        form["option_text_array[" + ind + "]"] = opt;
        form["option_is_selected_array[" + ind + "]"] = options[opt]
          ? "1"
          : "0";
        ind++;
      }
    }

    defaultFuncs
      .post(
        "https://www.facebook.com/messaging/group_polling/create_poll/?dpr=1",
        ctx.jar,
        form,
      )
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.payload.status != "success") {
          throw resData;
        }

        return callback();
      })
      .catch(function (err) {
        log.error("createPoll", err);
        return callback(err);
      });

    return returnPromise;
  }

  function createPollMqtt(title, options, threadID, callback) {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }

    ctx.wsReqNumber += 1;
    ctx.wsTaskNumber += 1;

    const taskPayload = {
      question_text: title,
      thread_key: threadID,
      options: options,
      sync_group: 1,
    };

    const task = {
      failure_count: null,
      label: "163",
      payload: JSON.stringify(taskPayload),
      queue_name: "poll_creation",
      task_id: ctx.wsTaskNumber,
    };

    const content = {
      app_id: "2220391788200892",
      payload: JSON.stringify({
        data_trace_id: null,
        epoch_id: parseInt(generateOfflineThreadingID()),
        tasks: [task],
        version_id: "7158486590867448",
      }),
      request_id: ctx.wsReqNumber,
      type: 3,
    };

    // if (isCallable(callback)) {
    //   // to be implemented
    // }

    ctx.mqttClient.publish("/ls_req", JSON.stringify(content), {
      qos: 1,
      retain: false,
    });
  }

  return function createPoll(title, threadID, options, callback) {
    if (ctx.mqttClient) {
      try {
        createPollMqtt(reaction, messageID, threadID, callback);
        callback();
      } catch (e) {
        createPollNoMqtt(title, threadID, options, callback);
      }
    } else {
      return createPollNoMqtt(title, threadID, options, callback);
    }
  };
};

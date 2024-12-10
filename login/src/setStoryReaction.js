'use strict';

var utils = require('../utils');
var log = require('npmlog');

module.exports = function (http, api, ctx) {
  return function setStoryReaction(storyID, react, callback) {
    var cb;
    var rtPromise = new Promise(function (resolve, reject) {
      cb = error => error ? reject(error) : resolve();
    });

    if (typeof react == 'function') {
      callback = react;
      react = null;
    }
    if (typeof callback == 'function') cb = callback;
    if (typeof react != 'string') react = '👍';

    var form = {
      fb_api_req_friendly_name: 'useStoriesSendReplyMutation',
      variables: JSON.stringify({
        input: {
          attribution_id_v2: `StoriesCometSuspenseRoot.react,comet.stories.viewer,unexpected,${Date.now()},538296,,;CometHomeRoot.react,comet.home,via_cold_start,${Date.now()},850302,4748854339,`,
          lightweight_reaction_actions: {
            offsets: [0],
            reaction: react
          },
          message: react,
          story_id: storyID,
          story_reply_type: "LIGHT_WEIGHT",
          actor_id: ctx.userID,
          client_mutation_id: Math.round(Math.random() * 19).toString()
        }
      }),
      doc_id: 4826141330837571
    }

    http
      .post('https://www.facebook.com/api/graphql/', ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, http))
      .then(function (res) {
        if (res.errors) throw res;
        return cb();
      })
      .catch(function (err) {
        log.error('setPostReaction', err);
        return cb(err);
      });

    return rtPromise;
  }
}
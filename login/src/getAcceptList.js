"use strict";

var utils = require('../utils');
var log = require('npmlog');

module.exports = function (http, api, ctx) {
  return function getAcceptList(callback) {
    var form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "FriendingCometFriendsBadgeCountClearMutation",
      variables: JSON.stringify({
        hasTopTab: true,
        hasBookmark: true,
        input: {
          source: "friending_tab",
          actor_id: ctx.userID,
          client_mutation_id: Math.round(Math.random() * 19).toString()
        }
      }),
      server_timestamps: true,
      doc_id: "6500595106704138"
    };

    http.post('https://www.facebook.com/api/graphql/', ctx.jar, form, null, null)
      .then(utils.parseAndCheckLogin(ctx, http))
      .then(function (res) {
        if (res.errors) {
          return callback(JSON.stringify(res.errors, null, 2));
        }
        return callback(JSON.stringify(res.data, null, 2));
      })
      .catch(function (err) {
        log.error('addFriends', err);
        return callback(err);
      });
  };
};
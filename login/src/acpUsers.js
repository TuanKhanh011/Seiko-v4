"use strict";

var utils = require('../utils');
var log = require('npmlog');

module.exports = function (http, api, ctx) {
  return function acpUsers(userID, callback) {
    var form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
      variables: JSON.stringify({
        input: {
          attribution_id_v2: `FriendingCometFriendRequestsRoot.react,comet.friending.friendrequests,unexpected,${Date.now()},609381,2356318349,,;FriendingCometRoot.react,comet.friending,tap_tabbar,${Date.now()},496978,2356318349,,`,
          friend_requester_id: userID,
          friending_channel: "FRIENDS_HOME_MAIN",
          actor_id: ctx.globalOptions.pageID || ctx.userID,
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 1,
        refresh_num: 0
      }),
      server_timestamps: true,
      doc_id: "26226851996930142"
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
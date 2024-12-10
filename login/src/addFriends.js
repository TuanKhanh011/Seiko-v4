"use strict";

var utils = require('../utils');
var log = require('npmlog');

module.exports = function (http, api, ctx) {
  return async function addFriends(userID, callback) {
    var form = {
      "__av": ctx.userID,
      "fb_api_caller_class": "RelayModern",
      "fb_api_req_friendly_name": "FriendingCometFriendRequestSendMutation",
      "variables": JSON.stringify({
        "input": {
          "attribution_id_v2": "ProfileCometTimelineListViewRoot.react,comet.profile.timeline.list,unexpected,"+Date.now()+",510030,190055527696468,,;SearchCometGlobalSearchDefaultTabRoot.react,comet.search_results.default_tab,tap_search_bar," + Date.now() + ",830835,391724414624676,,",
          "friend_requestee_ids": [userID],
          "friending_channel": "PROFILE_BUTTON",
          "warn_ack_for_ids": [],
          "actor_id": ctx.userID,
          "client_mutation_id": "3"
        },
        "scale": "1"
      }),
      "server_timestamps": true,
      "doc_id": "7607575099364225"
    };

    http.post('https://www.facebook.com/api/graphql/', ctx.jar, form, null, null)
    .then(utils.parseAndCheckLogin(ctx, http))
    .then(function (res) {
     return callback((JSON.stringify(res.data?.friend_request_send?.friend_requestees?.[0], null, 2)) || { error: "Không thể gửi lời mời kết bạn"});
    })
    .catch(function (err) {
      log.error('addFriends', err);
      return callback(err);
    });
  }  
};
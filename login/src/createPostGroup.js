"use strict";

const utils = require('../utils');
const log = require('npmlog');

module.exports = function (http, api, ctx) {
  return async function createPostGroup(text, groupID, callback) {
    try {
      const formData = {
        input: {
          composer_entry_point: "hosted_inline_composer",
          composer_source_surface: "group",
          composer_type: "group",
          logging: {
            composer_session_id: utils.getGUID()
          },
          source: "WWW",
          message: {
            ranges: [],
            text: text
          },
          with_tags_ids: null,
          inline_activities: [],
          explicit_place_id: "0",
          text_format_preset_id: "0",
          navigation_data: {
            attribution_id_v2: `CometGroupDiscussionRoot.react,comet.group,unexpected,${Date.now()},582916,2361831622,,;GroupsCometJoinsRoot.react,comet.groups.joins,unexpected,1723903257951,878430,,,;GroupsCometCrossGroupFeedRoot.react,comet.groups.feed,tap_bookmark,${Date.now()},406054,2361831622,,`
          },
          tracking: [null],
          event_share_metadata: {
            surface: "newsfeed"
          },
          audience: {
            to_id: groupID
          },
          actor_id: ctx.userID,
          client_mutation_id: Math.floor(Math.random() * 17)
        },
        feedLocation: "GROUP",
        feedbackSource: 0,
        focusCommentID: null,
        gridMediaWidth: null,
        groupID: null,
        scale: 1,
        privacySelectorRenderLocation: "COMET_STREAM",
        checkPhotosToReelsUpsellEligibility: false,
        renderLocation: "group",
        useDefaultActor: false,
        inviteShortLinkKey: null,
        isFeed: false,
        isFundraiser: false,
        isFunFactPost: false,
        isGroup: true,
        isEvent: false,
        isTimeline: false,
        isSocialLearning: false,
        isPageNewsFeed: false,
        isProfileReviews: false,
        isWorkSharedDraft: false,
        hashtag: null,
        canUserManageOffers: false
      };

      const form = {
        av: ctx.userID,
        fb_api_req_friendly_name: "ComposerStoryCreateMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "7913168052133025",
        variables: JSON.stringify(formData),
        server_timestamps: true
      };
      const res = await http.post('https://www.facebook.com/api/graphql/', ctx.jar, form, null, null).then(utils.parseAndCheckLogin(ctx, http));
      return callback(JSON.stringify(res?.[0]?.data?.story_create, null, 2) || { error: "Không thể tạo bài viết" });
    } catch (err) {
      log.error('createPostGroup', err);
      return callback(err);
    }
  };
};
const got = require('got');
const JSONB = require('json-bigint');

module.exports = async function(url) {
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
     }
     return number.toLocaleString('de-DE');
}
const AttachmentFormatter = {
    stories(data, storyID) {
        return {
            bucketID: data?.bucket?.id.toString(),
            message: '',
            author: data?.bucket?.story_bucket_owner?.name,
            queryStorieID: storyID ? storyID : null,
            attachments: data?.bucket?.unified_stories?.edges.map(item => ({
                id: item?.node?.id,
                like: formatNumber(item?.node?.story_card_info?.feedback_summary?.total_reaction_count) || 0,
                type: item?.node?.attachments?.[0]?.media?.__typename,
                url: item?.node?.attachments?.[0]?.media?.__typename === 'Photo' ? item?.node?.attachments?.[0]?.media?.image?.uri :
                    {
                        sd: item?.node?.attachments?.[0]?.media?.browser_native_sd_url,
                        hd: item?.node?.attachments?.[0]?.media?.browser_native_hd_url,
                    }
            }))
        };
    },
    previewMedia(data) {
        return {
            id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.post_id,
            message: (data?.link_preview?.story_attachment?.title || '') + '',
            like: formatNumber(data?.link_preview?.story_attachment?.target?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.link_preview?.story_attachment?.target?.top_level_comments?.total_count) || 0,
            share: formatNumber(data?.link_preview?.story_attachment?.target?.reshares?.count) || 0,
            author: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video_owner?.name || data?.link_preview?.story_attachment?.style_infos?.[0]?.actors[0]?.name,
            attachments: [{
                id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.id.toString(),
                type: 'Video',
                url: {
                    sd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_sd,
                    hd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_hd,
                }
            }]
        };
    },
    mobileMedia(data) {
        return {
            id: data?.reduced_node?.post_id.toString(),
            message: (data?.reduced_node?.message?.text || '') + '',
            like: formatNumber(data?.reduced_node?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.reduced_node?.feedback?.top_level_comments?.total_count) || 0,
            author: (data?.reduced_node?.feedback?.owning_profile?.name),
            attachments: data?.mediaset?.media?.edges.map(item => ({
                id: item.node?.id.toString(),
                type: item.node?.__typename,
                url: item.node?.__typename == 'Photo' ? item?.node?.image?.uri :
                    {
                        sd: item?.node?.playable_url,
                        hd: item?.node?.hd_playable_url,
                    },
            }))
        };
    },
    webMedia(data) {
        const type = data?.attachments[0]?.styles?.attachment ||
            data.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.comet_sections ||
            data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment;
        if (type?.subattachments) {
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: (data?.attachments[0]?.styles?.attachment?.subattachments || data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment?.subattachments).filter(item => item?.multi_share_media_card_renderer?.attachment?.media?.__typename !== 'GenericAttachmentMedia').map(item => ({
                    id: item?.multi_share_media_card_renderer?.attachment?.media?.id?.toString(),
                    type: item?.multi_share_media_card_renderer?.attachment?.media?.__typename,
                    url: item?.multi_share_media_card_renderer?.attachment?.media?.__typename === 'Photo' ? item?.multi_share_media_card_renderer?.attachment?.media?.image?.uri :
                        {
                            sd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_sd_url,
                            hd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_hd_url,
                        },

                }))
            };
        } else if (type?.media) {
            const mediaData = data?.attachments[0]?.styles?.attachment || data.attached_story?.attachments[0]?.styles?.attachment;
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: mediaData?.media?.id?.toString(),
                    type: mediaData?.media?.__typename,
                    url: mediaData?.media?.__typename == 'Photo' ? mediaData?.media?.photo_image?.uri || mediaData?.media?.image?.uri :
                        {
                            sd: mediaData?.media.browser_native_sd_url,
                            hd: mediaData?.media.browser_native_he_url,
                        }
                }]
            };
        } else if (type?.style_infos) {
            return {
                message: (data?.message?.text || (data?.attachments[0]?.styles?.attachment?.style_infos[0]?.fb_shorts_story?.message?.text || '')) + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: data?.attachments[0]?.styles?.attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.playback_video?.id?.toString(),
                    type: 'Video',
                    url: {
                        sd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_sd_url,
                        hd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_hd_url,
                    }
                }]
            };
        } else return { error: 'Cannot fetch stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
    }
};
const Utils = {
    postWithToken: async (url, form, userAgent) => {
        return await got.post(url, {
            headers: {
                'authorization': 'OAuth EAAAAUaZA8jlABO9Nb4HYCJqtDk5QtIF3Ssr5OHw9ZBfNr7rzK0XzaVN8fhxhYI33ZCIgd4gxDswYn3VZB8idgOeMCUZBiP0Qu3CZApUCPVqzUnkxKEYE01RiwKizqzwZC1QMj9rzHZC1L5l0cSIvn78h1ZB5KVH9fI30pvG4ZC0bAZA30LG7sCR4N5R0VqekAZDZD',
                'user-agent': '[FBAN/FB4A;FBAV/417.0.0.33.65;FBBV/480085463;FBDM/{density=2.75,width=1080,height=2029};FBLC/vi_VN;FBRV/0;FBCR/VinaPhone;FBMF/Xiaomi;FBBD/Xiaomi;FBPN/com.facebook.katana;FBDV/MI 8 SE;FBSV/9;FBOP/1;FBCA/armeabi-v7a:armeabi;]',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form,
            decompress: true,
        });
    },
    postWithCookie: async (url, form, userAgent) => {
        return await got.post(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': global.account.cookie,
            },
            form,
            decompress: true,
        });
    },
    getType: (obj) => {
        const cName = obj.constructor?.name;
        const gName = Object.prototype.toString.call(obj).slice(8, -1);
        if (cName?.toLowerCase() === gName?.toLowerCase()) return cName;
        else return !cName || cName?.toLowerCase() === 'object' ? gName : cName;
    },
    makeParsable: (data) => {
        const withoutForLoop = data.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, '');
        const maybeMultipleObjects = withoutForLoop.split(/\}\s*\{/);
        if (maybeMultipleObjects.length === 1) return maybeMultipleObjects[0];
        return `[${maybeMultipleObjects.join('},{')}]`;
    },
    parseFromBody: (data) => {
        if (typeof data.body !== 'string') return data.body;
        try {
            const result = JSON.parse(Utils.makeParsable(data));
            const type = Utils.getType(result);
            return type === 'Object' || type === 'Array' ? result : data.body;
        } catch (err) {
            return data.body;
        }
    },
    parseFromJSONB: (data) => {
        return JSONB.parse(data);
    }
};
const urlRegex = /\b(?:https?:\/\/(?:www\.)?(?:facebook\.com|mbasic\.facebook\.com|m\.facebook\.com|mobile\.facebook\.com|fb\.watch|web\.facebook)[^\s]*)\b/g;
const IGUrlRegex = /(https:\/\/www\.instagram\.com\/(stories|p|reel|tv)\/[a-zA-Z0-9_\-\/?=\.]+)(?=\s|\/|$)/g;
const onlyVideoRegex = /^https:\/\/(?:www|m|mbasic|mobile|web)\.facebook\.com\/(?:watch\?v=\d+|reel\/|videos\/[^\/?#]+\/?\??[^\/?#]*)$/;
const profileRegex = /^https:\/\/(?:(www|m|mbasic|mobile|web)\.)?facebook\.com\/(?!(?:watch|photo|groups|share|stories|reel|videos|pages|story.php|permalink.php|video.php))(?:(?!profile\.php\?id=\d+\?)[^\/?]+|profile\.php\?id=\d+\?(?!id=).*|\profile\.php\?id=\d+$)\/?\??[^\/?]*$/;
const storiesRegex = /\/stories\/(\d+)(?:\/([^\/?]+))?/;
async function StoriesBucketQuery(bucketID, storyID) {
    const resData = await Utils.postWithToken(
        'https://graph.facebook.com/graphql',
        {
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'StoriesSuspenseContentPaneRootWithEntryPointQuery',
            doc_id: '7114359461936746',
            variables: JSON.stringify({ bucketID: bucketID, blur: 10, cursor: null, scale: 1 })
        },
    ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
    return AttachmentFormatter.stories((resData?.data || resData?.[0].data), storyID);
}
async function FetchStoriesAndMedia(url) {
    try {
        if (storiesRegex.test(url))
            return StoriesBucketQuery(storiesRegex.exec(url)[1], storiesRegex.exec(url)[2]);
        if (!urlRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
        if (profileRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
        let resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'ComposerLinkPreviewQuery',
                client_doc_id: '89598650511870084207501691272',
                variables: JSON.stringify({
                    params: {
                        url: url
                    }
                })
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        if (onlyVideoRegex.test(url) || onlyVideoRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)) || IGUrlRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)))
            return AttachmentFormatter.previewMedia(resData.data);
        const share_params = Utils.parseFromJSONB(resData?.data?.link_preview?.share_scrape_data).share_params;
        if (share_params && storiesRegex.test(share_params?.urlInfo?.canonical))
            return StoriesBucketQuery(storiesRegex.exec(share_params?.urlInfo?.canonical)[1], storiesRegex.exec(share_params?.urlInfo?.canonical)[2]);
        if (!resData?.data?.link_preview?.story?.id) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        const post_id = share_params[0]?.toString();
        const node_id = resData?.data?.link_preview?.story?.id;
        resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'FetchGraphQLStoryAndMediaFromTokenQuery',
                client_doc_id: '14968485422525517963281561600',
                variables: JSON.stringify({ action_location: "feed", include_image_ranges: true, image_medium_height: 2048, query_media_type: "ALL", automatic_photo_captioning_enabled: false, image_large_aspect_height: 565, angora_attachment_profile_image_size: 110, profile_pic_media_type: "image/x-auto", poll_facepile_size: 110, scale: 3, enable_cix_screen_rollout: true, default_image_scale: 3, angora_attachment_cover_image_size: 1320, poll_voters_count: 5, image_low_height: 2048, image_large_aspect_width: 1080, image_low_width: 360, image_high_height: 2048, question_poll_count: 100, node_id: node_id, icon_scale: 3, nt_context: { styles_id: "e6c6f61b7a86cdf3fa2eaaffa982fbd1", using_white_navbar: true, pixel_ratio: 3, is_push_on: true, bloks_version: "c3cc18230235472b54176a5922f9b91d291342c3a276e2644dbdb9760b96deec" }, can_fetch_suggestion: false, profile_image_size: 110, reading_attachment_profile_image_height: 371, reading_attachment_profile_image_width: 248, fetch_fbc_header: true, size_style: "contain-fit", photos_feed_reduced_data_fetch: true, media_paginated_object_first: 200, in_channel_eligibility_experiment: false, fetch_cix_screen_nt_payload: true, media_token: `pcb.${post_id}`, fetch_heisman_cta: true, fix_mediaset_cache_id: true, location_suggestion_profile_image_size: 110, image_high_width: 1080, media_type: "image/jpeg", image_medium_width: 540 }),
                fb_api_caller_class: 'graphservice',
                fb_api_analytics_tags: JSON.stringify(["At_Connection", "GraphServices"])
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        if (!resData?.data?.mediaset?.media?.edges || resData?.data?.mediaset?.media?.edges.length == 0) {
            resData = await Utils.postWithToken(
                'https://graph.facebook.com/graphql',
                {
                    fb_api_req_friendly_name: 'CometSinglePostContentQuery',
                    doc_id: 8362454010438212,
                    variables: JSON.stringify({ feedbackSource: 2, feedLocation: "PERMALINK", privacySelectorRenderLocation: "COMET_STREAM", renderLocation: "permalink", scale: 1.5, storyID: node_id, useDefaultActor: false, })
                },
            ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);

            if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            const { content } = resData?.data?.node?.comet_sections || resData[0]?.data?.node?.comet_sections;
            return { id: post_id, ...AttachmentFormatter.webMedia(content.story) };
        }
        return AttachmentFormatter.mobileMedia(resData?.data);
    } catch (error) {
        console.error(error);
        return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: error?.response || error.message };
    }
} try {
        const result = await FetchStoriesAndMedia(decodeURIComponent(url));
        return result;
    } catch (error) {
        console.log(error);
    }
}
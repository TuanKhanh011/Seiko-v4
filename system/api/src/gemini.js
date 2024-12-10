class Gemini {
    static JSON = "json";
    static MD = "markdown";
    SNlM0e;
    #headers;
    #initPromise;
    #geminiURL = "https://gemini.google.com";
    //#fetch = fetch;
    #fetch = require('node-fetch');
    constructor(cookie, config) {
        if (config?.fetch) this.#fetch = config.fetch;

        if (cookie) {
            this.#initPromise = this.#init(cookie);
        } else {
            throw new Error("Please provide a Cookie when initializing Gemini.");
        }
        this.cookie = cookie;
    }
    async #init(cookie) {
        this.#headers = {
            Host: "gemini.google.com",
            "X-Same-Domain": "1",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Origin: this.#geminiURL,
            Referer: this.#geminiURL,
            Cookie: (typeof cookie === "object") ? (Object.entries(cookie).map(([key, val]) => `${key}=${val};`).join("")) : ("__Secure-1PSID=" + cookie),
        };
        let responseText;
        // Attempt to retrieve SNlM0e
        try {
            responseText = await this.#fetch(this.#geminiURL, {
                method: "GET",
                headers: this.#headers,
                credentials: "include",
            })
                .then((response) => response.text());
        } catch (e) {
            throw new Error(
                "Could not fetch Google Gemini. You may be disconnected from internet: " +
                e
            );
        }
        try {
            const SNlM0e = responseText.match(/SNlM0e":"(.*?)"/)[1];
            // Assign SNlM0e and return it
            this.SNlM0e = SNlM0e;
            return SNlM0e;
        } catch {
            throw new Error(
                "Could not use your Cookie. Make sure that you copied correctly the Cookie with name __Secure-1PSID exactly. If you are sure your cookie is correct, you may also have reached your rate limit."
            );
        }
    }

    async #uploadImage(name, buffer) {
        let size = buffer.byteLength;
        let formBody = `${encodeURIComponent("File name")}=${encodeURIComponent(name)}`;

        try {
            let response = await this.#fetch(
                "https://content-push.googleapis.com/upload/",
                {
                    method: "POST",
                    headers: {
                        "X-Goog-Upload-Command": "start",
                        "X-Goog-Upload-Protocol": "resumable",
                        "X-Goog-Upload-Header-Content-Length": size,
                        "X-Tenant-Id": "gemini",
                        "Push-Id": "feeds/mcudyrk2a4khkz",
                    },
                    body: formBody,
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Upload failed with status " + response.status);
            }

            const uploadUrl = response.headers.get("X-Goog-Upload-URL");
            response = await this.#fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "X-Goog-Upload-Command": "upload, finalize",
                    "X-Goog-Upload-Offset": 0,
                    "X-Tenant-Id": "gemini",
                },
                body: buffer,
                credentials: "include",
            });

            const imageFileLocation = await response.text();

            return imageFileLocation;
        } catch (e) {
            throw new Error(
                "Could not fetch Google Gemini. You may be disconnected from internet: " +
                e
            );
        }
    }

    async #query(message, config) {
        if (!message) {
            throw new Error("Message cannot be null or undefined.");
        }

        let { ids, imageBuffer } = config;

        await this.#initPromise;

        const params = {
            bl: "boq_assistant-bard-web-server_20240201.08_p9",
            _reqID: ids?._reqID ?? "0",
            rt: "c",
        };

        const messageStruct = [
            [message],
            null,
            [null, null, null],
        ];

        if (imageBuffer) {
            let imageLocation = await this.#uploadImage(
                `bard-ai_upload`,
                imageBuffer
            );
            messageStruct[0].push(0, null, [
                [[imageLocation, 1], "bard-ai_upload"],
            ]);
        }

        if (ids) {
            const { conversationID, responseID, choiceID } = ids;
            messageStruct[2] = [conversationID, responseID, choiceID];
        }

        const data = {
            "f.req": JSON.stringify([null, JSON.stringify(messageStruct)]),
            at: this.SNlM0e,
        };

        const url = new URL(
            "/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate",
            this.#geminiURL
        );

        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }

        const formBody = Object.entries(data)
            .map(
                ([property, value]) =>
                    `${encodeURIComponent(property)}=${encodeURIComponent(
                        value
                    )}`
            )
            .join("&");

        const chatData = await this.#fetch(url.toString(), {
            method: "POST",
            headers: this.#headers,
            body: formBody,
            credentials: "include",
        })
            .then((response) => {
                return response.text();
            })
            .then((text) => {
                return JSON.parse(text.split("\n")[3])[0][2];
            })
            .then((rawData) => JSON.parse(rawData));

        const answer = chatData[4][0];

        const text = answer[1][0];

        const images =
            answer[4]?.map((x) => ({
                tag: x[2],
                url: x[3][0][0],
                info: {
                    raw: x[0][0][0],
                    source: x[1][0][0],
                    alt: x[0][4],
                    website: x[1][1],
                    favicon: x[1][3],
                },
            })) ?? [];

        return {
            content: text,
            images: images,
            ids: {
                conversationID: chatData[1][0],
                responseID: chatData[1][1],
                choiceID: answer[0],
                _reqID: String(parseInt(ids?._reqID ?? 0) + 100000),
            },
        };
    }

    async #parseConfig(config) {
        let result = {
            useJSON: false,
            imageBuffer: undefined,
            ids: undefined,
        };

        if (config?.format) {
            switch (config.format) {
                case Gemini.JSON:
                    result.useJSON = true;
                    break;
                case Gemini.MD:
                    result.useJSON = false;
                    break;
                default:
                    throw new Error(
                        "Format can only be Gemini.JSON for JSON output or Gemini.MD for Markdown output."
                    );
            }
        }

        if (config?.image) {
            if (
                config.image instanceof ArrayBuffer
            ) {
                result.imageBuffer = config.image;
            } else if (
                typeof config.image === "string" &&
                /\.(jpeg|jpg|png|webp)$/.test(config.image)
            ) {
                let fs;

                try {
                    fs = require("fs");
                } catch {
                    throw new Error(
                        "Loading from an image file path is not supported in a browser environment.",
                    );
                }

                result.imageBuffer = fs.readFileSync(
                    config.image,
                ).buffer;
            } else {
                throw new Error(
                    "Provide your image as a file path to a .jpeg, .jpg, .png, or .webp, or a Buffer."
                );
            }
        }

        if (config?.ids) {
            if (config.ids.conversationID && config.ids.responseID && config.ids.choiceID && config.ids._reqID) {
                result.ids = config.ids;
            } else {
                throw new Error(
                    "Please provide the IDs exported exactly as given."
                );
            }
        }
        return result;
    }

    async ask(message, config) {
        let { useJSON, imageBuffer, ids } = await this.#parseConfig(config);
        let response = await this.#query(message, { imageBuffer, ids });
        return useJSON ? response : response.content;
    }

    createChat(ids) {
        let gemini = this;
        class Chat {
            ids = ids;

            async ask(message, config) {
                let { useJSON, imageBuffer } = await gemini.#parseConfig(config);
                let response = await gemini.#query(message, {
                    imageBuffer,
                    ids: this.ids,
                });
                this.ids = response.ids;
                return useJSON ? response : response.content;
            }

            export() {
                return this.ids;
            }
        }

        return new Chat();
    }
}
module.exports = Gemini;
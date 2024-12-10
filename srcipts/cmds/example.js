module.exports = class {
    static config = {
        name: "example",
        aliases: ["example"],
        version: "1.0.0",
        role: 0,
        author: "DongDev",
        info: "",
        Category: "Admin",
        guides: "",
        cd: 5,
        hasPrefix: true,
        images: []
    };

    static async onRun({ api, event, msg, model, Threads, Users, Currencies, args }) {
        // Logic for onRun
    }

    static async onEvent({ api, event, msg, model, Threads, Users, Currencies, args }) {
        // Logic for onEvent
    }

    static async onReaction({ api, event, msg, model, Threads, Users, Currencies, args, onReaction }) {
        // Logic for onReaction
    }

    static async onLoad({ api, model }) {
        // Logic for onLoad
    }

    static async onReply({ api, event, msg, model, Threads, Users, Currencies, args, onReply }) {
        // Logic for onReply
    }
}

/*
this.config = {
 name: "example",
 aliases: ["example"],
 version: "1.2.9",
 role: 3,
 author: "DongDev",
 info: "",
 Category: "Admin",
 guides: "[]",
 cd: 5,
 hasPrefix: true,
 images: [],
};
this.onRun = async o=>{};
this.onLoad = async o=>{};
this.onEvent = async o=>{};
this.onReaction = async o=>{};
this.onReply = async o=>{};
*/


/*
module.exports = {
  config: {
    name: "example",
    aliases: [""],
    version: "1.0.0",
    role: 0,
    author: "DongDev",
    info: "",
    Category: "Admin",
    guides: "",
    cd: 5,
    hasPrefix: true
    images: [],
  },
  onRun: async o=>{},
  onEvent: async o=>{},
  onReaction: async o=>{},
  onLoad: async o=>{},
  onReply: async o=>{},
}
*/
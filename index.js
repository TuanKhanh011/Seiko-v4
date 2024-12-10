const { spawn } = require("child_process");
const logger = require(process.cwd() + "/main/utils/log.js");
function startBot(message) {
    (message) ? logger(message, "[ STARTING ]") : "";
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "seiko.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });
    child.on("close", (codeExit) => {
        if (codeExit != 0 || global.countRestart && global.countRestart < 5) {
            startBot("Tiến Hành Khởi Động Lại...");
            global.countRestart += 1;
            return;
        } else return;
    });
    child.on("error", function (error) {
        logger("Đã xảy ra lỗi: " + JSON.stringify(error), "[ STARTING ]");
    });
}
startBot();
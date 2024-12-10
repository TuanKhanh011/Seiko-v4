const chalk = require('chalk');
const gradient = require("gradient-string");
const co = gradient("#a200ff", "#21b5ff", "#a200ff");
const error = chalk.red.bold;
module.exports = (text, type) => {
  switch (type) {
    case "warn":
      process.stderr.write(co(`\r[ ERROR ] > ${text}`) + '\n');
      break;
    case "error":
      process.stderr.write(error(`\r[ ERROR ] > ${text}`) + '\n');
      break;
    default:
      process.stderr.write(chalk.bold(co(`\r${String(type).toUpperCase()} > ${text} `) + '\n'));
      break;
  }
};
module.exports.loader = (data, option) => {
  switch (option) {
    case "warn":
      console.log(chalk.bold(co("[ WARNING ] > ")) + co(data));
      break;
    case "error":
      console.log(chalk.bold(co("[ ERROR ] > ")) + error(data));
      break;
    default:
      console.log(chalk.bold(co("[ LOADING ] > ")) + chalk.bold(co(data)));
      break;
  }
}
module.exports.load = (data, option) => {
  let coloredData = '';
  switch (option) {
    case "warn":
      console.log(chalk.bold(co("[ LOGIN ] > ")) + co(data));
      break;
    case "error":
      console.log(chalk.bold(co("[ ERROR ] > ")) + error(data));
      break;
    default:
      console.log(chalk.bold(co("[ LOGIN ] > ")) + chalk.bold(co(data)));
      break;
  }
};
module.exports.autoLogin = async (onBot, botData) => {
  onBot(botData);
};
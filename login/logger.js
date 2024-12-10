const chalk = require('chalk');
const gradient = require('gradient-string');
function getType(obj) {
       return Object.prototype.toString.call(obj).slice(8, -1);
}
module.exports = {
	 	Normal: function(Str, Data, Callback) {
	   		        const mainName = global.Fca.Require.FastConfig.MainName || '[ SYSTEM ]';
				console.log(chalk.bold(gradient.pastel(mainName + ': ' + Str)));
				if (getType(Data) === 'Function' || getType(Data) === 'AsyncFunction') {
						return Data();
				}
				if (Data) {
						return Data;
				}
				if (getType(Callback) === 'Function' || getType(Callback) === 'AsyncFunction') {
						Callback();
				} else {
						return Callback;
				}
		},
		Warning: function(str, callback) {
				console.log(chalk.bold(chalk.magenta('[ LOGIN ]: ') + chalk.yellow(str)));
				if (getType(callback) === 'Function' || getType(callback) === 'AsyncFunction') {
						callback();
				} else {
						return callback;
				}
		},
		Error: function(str, callback) {
				if (!str) {
						console.log(chalk.bold(chalk.magenta('[ LOGIN ]: ') + chalk.red("Already Faulty")));
				} else {
						console.log(chalk.bold(chalk.magenta('[ LOGIN ]: ') + chalk.red(str)));
				}
				if (getType(callback) === 'Function' || getType(callback) === 'AsyncFunction') {
						callback();
				} else {
						return callback;
				}
		},
		Success: function(str, callback) {
				console.log(chalk.bold(gradient.pastel(global.Fca.Require.FastConfig.MainName || '[ SYSTEM ]') + ': ' + chalk.green(str)));
				if (getType(callback) === 'Function' || getType(callback) === 'AsyncFunction') {
						callback();
				} else {
						return callback;
				}
		},
		Info: function(str, callback) {
				console.log(chalk.bold(gradient.pastel(global.Fca.Require.FastConfig.MainName || '[ SYSTEM ]') + ': ' + chalk.blue(str)));
				if (getType(callback) === 'Function' || getType(callback) === 'AsyncFunction') {
						callback();
				} else {
						return callback;
				}
		}
};
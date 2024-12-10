const Sequelize = require("sequelize");
const { resolve } = require("path");
const storage = resolve(__dirname, "../sqlite/data.sqlite");

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        match: [
            /SQLITE_BUSY/,
            /SQLITE_LOCKED/,
            /SQLITE_READONLY/,
            /SQLITE_INTERRUPT/,
            /SQLITE_IOERR/,
            /SQLITE_CORRUPT/,
            /SQLITE_NOTADB/
        ],
        name: 'query',
        max: 5
    },
    logging: false,
    transactionType: 'IMMEDIATE',
    define: {
        underscored: false,
        freezeTableName: true,
        charset: 'utf8',
        dialectOptions: {
            collate: 'utf8_general_ci'
        },
        timestamps: true
    },
    sync: {
        force: false
    }
});

module.exports = {
    sequelize,
    Sequelize
};
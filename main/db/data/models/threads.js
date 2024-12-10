module.exports = function({ sequelize, Sequelize }) {
    const Threads = sequelize.define('Threads', {
        num: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        threadID: {
            type: Sequelize.BIGINT,
            unique: true,
            allowNull: false
        },
        threadInfo: {
            type: Sequelize.JSON,
            allowNull: true
        },
        data: {
            type: Sequelize.JSON,
            allowNull: true
        }
    }, {
        timestamps: true
    });

    return Threads;
};
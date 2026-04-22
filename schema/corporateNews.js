/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const corporate_news = sequelize.define(
        "corporate_news",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            Section_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            sno: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            DATE: {
                type: DataTypes.DATE,
                allowNull: true
            },
            time: {
                type: DataTypes.STRING,
                allowNull: true
            },
            heading: {
                type: DataTypes.STRING,
                allowNull: true
            },
            caption: {
                type: DataTypes.STRING,
                allowNull: true
            },
            arttext: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            createdAt: {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            },
            updatedAt: {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            }
        },
        {
            tableName: "corporate_news"
        }
    );
    return corporate_news;
};
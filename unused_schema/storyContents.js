/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const storyContents = sequelize.define(
        "storyContents",
        {
            content_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            content_type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            content_text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            content_url: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            expires_at: {
                type: DataTypes.STRING,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
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
            tableName: "storyContents"
        }
    );

    return storyContents;
};

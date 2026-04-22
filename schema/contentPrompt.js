/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const content_prompt = sequelize.define(
        "content_prompt",
        {
            content_prompt_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            content_prompt_type: {
                type: DataTypes.ENUM,
                values: ['link', 'attachment'],
                allowNull: false
            },
            content_prompt_text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            link_title: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            contentS3Path: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            creditUsed: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue : true
            },
            createdAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            },
            updatedAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            }
        },
        {
            tableName: "content_prompt"
        }
    );

    // Hook to update updated_at field before bulk updates
    content_prompt.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    content_prompt.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    content_prompt.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return content_prompt;
};

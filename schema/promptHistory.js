/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const prompt_history = sequelize.define(
        "prompt_history",
        {
            prompt_history_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id:{
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            prompt_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "prompts",
                    key: "prompt_id",
                },
            },
            person: {
                type: DataTypes.ENUM,
                values: ['bot', 'user'],
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            link: {
                type: DataTypes.JSON,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM,
                values: ['text', 'graph'],
            },
            focus_type: {
                type: DataTypes.ENUM,
                values: ['news', 'youtube','fund','reddit','news_bing','screener'],
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
            tableName: "prompt_history"
        }
    );

    // Hook to update updatedAt field before bulk updates
    prompt_history.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    prompt_history.beforeBulkCreate((instances, options) => {
        const currentTimestamp = moment().utcOffset(0).toISOString(true);
        instances.forEach(instance => {
            instance.createdAt = currentTimestamp;
            instance.updatedAt = currentTimestamp;
        });
    });

    // Hook to update created_at field before each update
    prompt_history.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    prompt_history.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return prompt_history;
};

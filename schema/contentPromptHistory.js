/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const content_prompt_history = sequelize.define(
        "content_prompt_history",
        {
            content_prompt_history_id: {
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
            content_prompt_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "content_prompt",
                    key: "content_prompt_id",
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
            type: {
                type: DataTypes.ENUM,
                values: ['link', 'attachment'],
            },
            render_type: {
                type: DataTypes.ENUM,
                values: ['text', 'graph'],
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
            tableName: "content_prompt_history"
        }
    );

    // Hook to update updated_at field before bulk updates
    content_prompt_history.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    content_prompt_history.beforeBulkCreate((instances, options) => {
        const currentTimestamp = moment().utcOffset(0).toISOString(true);
        instances.forEach(instance => {
            instance.createdAt = currentTimestamp;
            instance.updatedAt = currentTimestamp;
        });
    });

    // Hook to update created_at field before each update
    content_prompt_history.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    content_prompt_history.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return content_prompt_history;
};

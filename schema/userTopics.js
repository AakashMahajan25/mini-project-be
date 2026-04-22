/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const user_topics = sequelize.define(
        "user_topics",
        {
            user_topics_id: {
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
            topic_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
            },
        },
        {
            tableName: "user_topics",
            indexes: [
                {
                    unique: true,
                    fields: ['user_id','topic_id'] 
                }
            ]
        }
    );

    // Hook to update updatedAt field before bulk updates
    user_topics.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    
    // Hook to update created_at field before each update
    user_topics.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    user_topics.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return user_topics;
};

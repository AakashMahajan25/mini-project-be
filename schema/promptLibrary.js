/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const prompt_library = sequelize.define(
        "prompt_library",
        {
            prompt_library_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            
            prompt_text: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM,
                values: ['suggested','popular'],
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
            tableName: "prompt_library"
        }
    );

    // Hook to update updatedAt field before bulk updates
    prompt_library.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    prompt_library.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    prompt_library.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return prompt_library;
};

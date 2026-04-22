const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const suggestionPrompt = sequelize.define(
        "suggestion_prompt",
        {
            suggestion_prompt_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            prompt_text:{
                type: DataTypes.TEXT,
                allowNull: false,
            },
            prompt_description: {
                type: DataTypes.TEXT,
                allowNull: false,
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
            tableName: "suggestion_prompt"
        }
    );

    // Hook to update updatedAt field before bulk updates
    suggestionPrompt.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    suggestionPrompt.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return suggestionPrompt;
};

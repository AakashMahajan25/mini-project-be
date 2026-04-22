const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const suggestedNewsPrompt = sequelize.define(
        "suggested_news_prompt",
        {
            suggested_news_prompt_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            serial_no: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            question: {
                type: DataTypes.TEXT,
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
            }
        },
        {
            tableName: "suggested_news_prompt"
        }
    );

    // Hook to update updatedAt field before bulk updates
    suggestedNewsPrompt.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    suggestedNewsPrompt.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return suggestedNewsPrompt;
};

/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const responseHistory = sequelize.define(
        "response_history",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            question: {
                type: DataTypes.STRING,
                allowNull: false
            },
            response: {
                type: DataTypes.STRING,
                allowNull: false
            },
            count: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Total_Tokens: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Prompt_Tokens: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Completion_Tokens: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            tableName: "response_history"
        }
    );

    // Hook to update updatedAt field before bulk updates
    responseHistory.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    responseHistory.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    responseHistory.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return responseHistory;
};

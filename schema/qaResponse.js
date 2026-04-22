/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const qaResponses = sequelize.define(
        "qa_responses",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            credit_charge: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            question: {
                type: DataTypes.STRING,
                allowNull: false
            },
            response: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: "qa_responses"
        }
    );

    // Hook to update updatedAt field before bulk updates
    qaResponses.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    qaResponses.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    qaResponses.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return qaResponses;
};

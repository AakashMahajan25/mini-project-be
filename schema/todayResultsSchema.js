const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const todayResults = sequelize.define(
        "todayResults",
        {
            results_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            symbol: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            isin: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            co_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ResultDate: {
                type: DataTypes.DATE,
                allowNull: true,
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
            tableName: "todayResults"
        }
    );

    // Hook to update updatedAt field before bulk updates
    todayResults.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    todayResults.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    todayResults.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return todayResults;
};

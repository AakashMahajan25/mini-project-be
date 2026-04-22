const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const exchangeHoliday = sequelize.define(
        "exchangeHoliday",
        {
            exchangeHoliday_id: {
                type: DataTypes.BIGINT,
                allowNull: true,
                primaryKey: true,
                autoIncrement: true,
            },
            HolidayDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            Purpose: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            exchange: {
                type: DataTypes.ENUM,
                allowNull: true,
                values: ['BSE','NSE']
            },
            day: {
                type: DataTypes.STRING,
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
            tableName: "exchangeHoliday"
        }
    );

    // Hook to update updatedAt field before bulk updates
    exchangeHoliday.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    exchangeHoliday.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    exchangeHoliday.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return exchangeHoliday;
};

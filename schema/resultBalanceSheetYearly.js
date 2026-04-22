/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const resultBalanceSheetYearly = sequelize.define(
        "resultBalanceSheetYearly",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            COLUMNNAME: {
                type: DataTypes.STRING,
                allowNull: true
            },
            RID: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202303: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202203: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202103: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202003: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201903: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            rowno: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM,
                values: ['S', 'C'],
                allowNull: false
            },
            cocode: {
                type: DataTypes.BIGINT,
                allowNull: false
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
            tableName: "resultBalanceSheetYearly"
        }
    );

    resultBalanceSheetYearly.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    resultBalanceSheetYearly.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    resultBalanceSheetYearly.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return resultBalanceSheetYearly;
};

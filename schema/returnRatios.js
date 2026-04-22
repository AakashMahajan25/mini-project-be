/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const return_ratios = sequelize.define(
        "return_ratios",
        {
            return_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
            },
            Return_NetInterestMargin: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming unique to one set of data
            },
            Return_RO_Assets: {
                type: DataTypes.FLOAT,
                allowNull: true // Corrected to true, assuming it might be unique or not present in some records
            },
            Return_RO_Assets_NetProfit: {
                type: DataTypes.FLOAT,
                allowNull: true // Corrected based on dataset specifics
            },
            Return_RO_Assets_TotalFixedAssets: {
                type: DataTypes.FLOAT,
                allowNull: true // Corrected based on dataset specifics
            },
            Return_ROE: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Return_ROE_NetProfit: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Return_ROE_Networth: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Return_YieldOnAdvances: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming unique to one set of data
            },
            Return_YieldOnAdvances_Advances: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming unique to one set of data
            },
            Return_YieldOnAdvances_InterestEarned: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming unique to one set of data
            },
            Return_ReturnOnAssets: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming optional based on dataset uniqueness
            },
            Return_ROA_NetProfit: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on dataset uniqueness
            },
            Return_ROA_TotalFixedAssets: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on dataset uniqueness
            },
            Return_ROCE: {
                type: DataTypes.FLOAT,
                allowNull: true // Assuming optional based on dataset uniqueness
            },
            Return_ROCE_CapitalEmployed: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            Return_ROCE_EBIT: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            YRC: {
                type: DataTypes.INTEGER,
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
            tableName: "return_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    return_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    return_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    return_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return return_ratios;
};

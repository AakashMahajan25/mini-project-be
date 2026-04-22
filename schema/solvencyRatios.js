/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const solvency_ratios = sequelize.define(
        "solvency_ratios",
        {
            solvency_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
            },
            Solvency_CurrentRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Solvency_CurrentRatio_CurrentAsset: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Solvency_CurrentRatio_CurrentLiabilities: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Solvency_InterestCoverageRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Solvency_InterestCoverageRatio_EBIT: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Solvency_InterestCoverageRatio_InterestPayments: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Solvency_TotalDebtToEquityRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Solvency_TotalDebtToEquityRatio_Networth: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Solvency_TotalDebtToEquityRatio_TotalDebt: {
                type: DataTypes.INTEGER,
                allowNull: false
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
            tableName: "solvency_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    solvency_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    solvency_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    solvency_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return solvency_ratios;
};

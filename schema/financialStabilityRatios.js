/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const financial_stability_ratios = sequelize.define(
        "financial_stability_ratios",
        {
            financial_stability_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code:{
                type: DataTypes.INTEGER,
                allowNull: false
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
            },
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            TotalDebt_Equity: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            CurrentRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            QuickRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            InterestCover: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            TotalDebt_MCap: {
                type: DataTypes.FLOAT,
                allowNull: false
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
            tableName: "financial_stability_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    financial_stability_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    financial_stability_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    financial_stability_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return financial_stability_ratios;
};

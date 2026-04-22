/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const cashflow_ratios = sequelize.define(
        "cashflow_ratios",
        {
            cashflow_ratios_id: {
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
            CashFlowPerShare: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PricetoCashFlowRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            FreeCashFlowperShare: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PricetoFreeCashFlow: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            FreeCashFlowYield: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Salestocashflowratio: {
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
            tableName: "cashflow_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    cashflow_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    cashflow_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    cashflow_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return cashflow_ratios;
};

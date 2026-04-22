/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const yearly_result_based_ratios = sequelize.define(
        "yearly_result_based_ratios",
        {
            yearly_result_based_ratios_id: {
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
            YearEnd: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            MCAP: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EV: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PE: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PBV: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            DIVYIELD: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            DividendPayout: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EPS: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            BookValue: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            ROA: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            ROE: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            ROCE: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EBIT: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EBITDA: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EV_Sales: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EV_EBITDA: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            NetIncomeMargin: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            GrossIncomeMargin: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            AssetTurnover: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            CurrentRatio: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Debt_Equity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            NetDebt_EBITDA: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            EBITDA_Margin: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            TotalShareholdersEquity: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            ShorttermDebt: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            LongTermDebt: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            EPSDiluted: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            NetSales: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Netprofit: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            AnnualDividend: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            COGS: {
                type: DataTypes.FLOAT,
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
            tableName: "yearly_result_based_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    yearly_result_based_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    yearly_result_based_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    yearly_result_based_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return yearly_result_based_ratios;
};

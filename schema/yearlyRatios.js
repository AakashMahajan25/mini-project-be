/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const yearly_ratios = sequelize.define(
        "yearly_ratios",
        {
            yearly_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            YRC: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
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
                type: DataTypes.FLOAT,
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
                type: DataTypes.BIGINT,
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
                type: DataTypes.FLOAT,
                allowNull: true
            },
            CurrentRatio: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            Debt_Equity: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            FCF_Margin: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            Sales_TotalAsset: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            NetDebt_FCF: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            NetDebt_EBITDA: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            EBITDA_Margin: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            TotalShareHoldersEquity: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            ShorttermDebt: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LongtermDebt: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            SharesOutstanding: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            NetSales: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            Netprofit: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            AnnualDividend: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            COGS: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            RetainedEarnings: {
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
            tableName: "yearly_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    yearly_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    yearly_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    yearly_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return yearly_ratios;
};

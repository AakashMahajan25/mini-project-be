/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const daily_ratios = sequelize.define(
        "daily_ratios",
        {
            daily_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull:true,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull:true
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
            },
            TTMAson: {
                type: DataTypes.INTEGER,
                allowNull:true
            },
            MCAP: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EV: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            PE: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            PBV: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            DIVYIELD: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EPS: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            BookValue: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            ROA_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            ROE_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            ROCE_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EBIT_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EBITDA_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EV_Sales_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            EV_EBITDA_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            NetIncomeMargin_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            GrossIncomeMargin_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            AssetTurnover_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            CurrentRatio_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            Debt_Equity_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            Sales_TotalAssets_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            NetDebt_EBITDA_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            EBITDA_Margin_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            TotalShareHoldersEquity_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            ShorttermDebt_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            LongtermDebt_TTM: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            SharesOutstanding: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            EPSDiluted: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            NetSales: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            Netprofit: {
                type: DataTypes.FLOAT,
                allowNull:true
            },
            AnnualDividend: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            COGS: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            PEGRatio_TTM: {
                type: DataTypes.FLOAT,
                allowNull:false
            },
            DividendPayout_TTM: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Industry_PE: {
                type: DataTypes.FLOAT,
                allowNull:false
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
            tableName: "daily_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    daily_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    daily_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    daily_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return daily_ratios;
};

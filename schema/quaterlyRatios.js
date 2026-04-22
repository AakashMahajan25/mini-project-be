/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const quaterly_ratios = sequelize.define(
        "quaterly_ratios",
        {
            quaterly_ratios_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            type:{
                type: DataTypes.ENUM,
                values: ['C', 'S'],
            },
            QtrEnd: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            MCAP: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            EV: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            PE: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            PBV: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            EPS: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            BookValue: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EBIT: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EBITDA: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EV_Sales: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EV_EBITDA: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            NetIncomeMargin: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            GrossIncomeMargin: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EBITDAMargin: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            EPSDiluted: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            NetSales: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            Netprofit: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            COGS: {
                type: DataTypes.STRING(50),
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
            tableName: "quaterly_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    quaterly_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    quaterly_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    quaterly_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return quaterly_ratios;
};

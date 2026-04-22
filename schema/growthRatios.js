/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const growth_ratios = sequelize.define(
        "growth_ratios",
        {
            growth_ratios_id: {
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
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            NetSalesGrowth: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on whether this data is always available
            },
            EBITDAGrowth: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on whether this data is always available
            },
            EBITGrowth: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on whether this data is always available
            },
            PATGrowth: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on whether this data is always available
            },
            EPS: {
                type: DataTypes.FLOAT,
                allowNull: true // Adjust based on whether this data is always available
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
            tableName: "growth_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    growth_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    growth_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    growth_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return growth_ratios;
};

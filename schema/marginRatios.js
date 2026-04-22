/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const margin_ratios = sequelize.define(
        "margin_ratios",
        {
            margin_ratios_id: {
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
            PBIDTIM: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            EBITM: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PreTaxMargin: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PATM: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            CPM: {
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
            tableName: "margin_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    margin_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    margin_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    margin_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return margin_ratios;
};

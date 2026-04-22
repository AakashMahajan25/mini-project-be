/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const liquidity_ratios = sequelize.define(
        "liquidity_ratios",
        {
            liquidity_ratios_id: {
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
            Loans_to_Deposits: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Cash_to_Deposits: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Investment_toDeposits: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            IncLoan_to_Deposit: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Credit_to_Deposits: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            InterestExpended_to_Interestearned: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Interestincome_to_Totalfunds: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            InterestExpended_to_Totalfunds: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            CASA: {
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
            tableName: "liquidity_ratios"
        }
    );

    // Hook to update updated_at field before bulk updates
    liquidity_ratios.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    liquidity_ratios.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    liquidity_ratios.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return liquidity_ratios;
};

/* jshint indent: 2 */
const moment = require("moment");
const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const otp = sequelize.define(
        "otp",
        {
            otpId: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            expireTime: {
                type: DataTypes.STRING,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM,
                values: ['email', 'mobile'],
                allowNull: false
            },
            otp: {
                type: DataTypes.STRING,
                allowNull: false
            },
            emailId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            mobile: {
                type: DataTypes.STRING,
                allowNull: true
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
            tableName: "otp"
        }
    );
    
    // Hook to update updated_at field before bulk updates
    otp.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    otp.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    otp.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return otp;
};

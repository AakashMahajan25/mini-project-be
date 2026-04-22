/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const user_plans = sequelize.define(
        "user_plans",
        {
            user_plan_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            plan_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "plans",
                    key: "plan_id",
                },
            },
            credit_at_purchase: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            plan_price:{
                type: DataTypes.INTEGER,
                allowNull: false
            },
            credits_used: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            expiry_date: {
                type: DataTypes.STRING,
                allowNull: true
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
            tableName: "user_plans"
        }
    );

    // Hook to update updatedAt field before bulk updates
    user_plans.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    
    // Hook to update created_at field before each update
    user_plans.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    user_plans.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return user_plans;
};

/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const orders = sequelize.define(
        "orders",
        {
            order_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            transaction_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            user_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            user_plan_id:{
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "user_plans",
                    key: "user_plan_id",
                },
            },
            order_amount: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            payment_status: {
                type: DataTypes.ENUM,
                values: ['pending', 'paid', 'failed'],
                defaultValue: "pending"
            },
            failed_reason: {
                type: DataTypes.STRING,
                default:null,
            },
            razorpay_order_id:{
                type:DataTypes.TEXT,
                allowNull : true
            },
            razorpay_signature:{
                type:DataTypes.TEXT,
                allowNull : true
            },
            razorpay_payment_id:{
                type:DataTypes.TEXT,
                allowNull : true
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
            tableName: "orders"
        }
    );

    // Hook to update updated_at field before bulk updates
    orders.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    orders.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    orders.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return orders;
};

/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const planSchema = sequelize.define(
        "plans",
        {
            plan_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            plan_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            plan_type: {
                type: DataTypes.ENUM,
                values: ['topup', 'plan'],
                allowNull: false
            },
            subsciption_type: {
                type: DataTypes.ENUM,
                values: ['free', 'paid'],
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            highlights: {
                type: DataTypes.TEXT,
                default: []
            },
            credits_offered: {
                type: DataTypes.STRING,
                allowNull: false
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            validity: {
                type: DataTypes.INTEGER,
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
            tableName: "plans"
        }
    );

    // Hook to update updatedAt field before bulk updates
    planSchema.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    planSchema.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    planSchema.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return planSchema;
};

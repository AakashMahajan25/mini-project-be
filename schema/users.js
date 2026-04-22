/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const users = sequelize.define(
        "users",
        {
            user_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },
            phone_number: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },
            mobileVerified : {
                type: DataTypes.BOOLEAN,
                defaultValue : false
            },
            emailVerified : {
                type: DataTypes.BOOLEAN,
                defaultValue : false
            },
            user_type: {
                type: DataTypes.ENUM,
                values: ['user', 'admin'],
                allowNull: false,
                defaultValue: 'user'
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue : false
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
            tableName: "users"
        }
    );

    // Hook to update updatedAt field before bulk updates
    users.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    
    // Hook to update created_at field before each update
    users.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    users.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return users;
};

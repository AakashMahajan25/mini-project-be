/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const userDetails = sequelize.define(
        "user_details",
        {
            user_detail_id: {
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
            first_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            last_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            date_of_birth: {
                type: DataTypes.STRING,
                allowNull: true
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            profile_picture : {
                type: DataTypes.STRING,
                allowNull: true
            },
            country : {
                type: DataTypes.STRING,
                allowNull: false
            },
            broker: {
                type: DataTypes.STRING,
                allowNull: false
            },
            cognitoId : {
                type: DataTypes.STRING,
                allowNull: true
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
            tableName: "user_details"
        }
    );

    // Hook to update updatedAt field before bulk updates
    userDetails.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    userDetails.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    userDetails.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return userDetails;
};

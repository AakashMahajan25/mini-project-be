const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const exchangeInformation = sequelize.define(
        "exchangeInformation",
        {
            exchangeInfo_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            index_code: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            exchange: {
                type: DataTypes.ENUM,
                allowNull: true,
                values: ['BSE','NSE']
            },
            cocode :{
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            groupname: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            sc_code: {
                type: DataTypes.STRING,
                allowNull: true,
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
            tableName: "exchangeInformation"
        }
    );

    // Hook to update updatedAt field before bulk updates
    exchangeInformation.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    exchangeInformation.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    exchangeInformation.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return exchangeInformation;
};

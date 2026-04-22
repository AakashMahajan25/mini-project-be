const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const indexMaster = sequelize.define(
        "indexMaster",
        {
            indexMaster_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            index_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            exchange: {
                type: DataTypes.ENUM,
                allowNull: true,
                values: ['BSE','NSE']
            },
            index_code: {
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
            tableName: "indexMaster"
        }
    );

    // Hook to update updatedAt field before bulk updates
    indexMaster.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    indexMaster.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    indexMaster.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return indexMaster;
};

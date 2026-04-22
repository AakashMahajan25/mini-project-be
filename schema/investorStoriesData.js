const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const investorStoriesData = sequelize.define(
        "investor_stores_data",
        {
            investor_stores_data_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            data: {
                type: DataTypes.JSON,
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
            tableName: "investor_stores_data"
        }
    );

    // Hook to update updatedAt field before bulk updates
    investorStoriesData.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    investorStoriesData.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return investorStoriesData;
};

const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const pledgeSharesDetails = sequelize.define(
        "pledge_shares_details",
        {
            pledge_shares_details_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            date: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            Type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            TotalPledgeShares: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            Perc_TotalSharesHeld: {
                type: DataTypes.FLOAT,
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
            tableName: "pledge_shares_details"
        }
    );

    // Hook to update updatedAt field before bulk updates
    pledgeSharesDetails.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    pledgeSharesDetails.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return pledgeSharesDetails;
};

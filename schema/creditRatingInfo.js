const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const creditRatingInfo = sequelize.define(
        "credit_rating_info",
        {
            credit_rating_info_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            RATDATE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            SECTYPE: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            AMOUNT: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            RATING: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            RATINGBY: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            TYPE: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            NOTE: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            STOBLIG: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            STATTYPE: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
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
            tableName: "credit_rating_info"
        }
    );

    // Hook to update updatedAt field before bulk updates
    creditRatingInfo.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    creditRatingInfo.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return creditRatingInfo;
};

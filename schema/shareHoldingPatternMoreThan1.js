/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const shareHoldingPatternMoreThan1 = sequelize.define(
        "shareHoldingPatternMoreThan1",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            yrc: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            slno: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            PercentageStakeHolding: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            cocode: {
                type: DataTypes.BIGINT,
                allowNull: false
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
            tableName: "shareHoldingPatternMoreThan1"
        }
    );

    shareHoldingPatternMoreThan1.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    shareHoldingPatternMoreThan1.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    shareHoldingPatternMoreThan1.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return shareHoldingPatternMoreThan1;
};

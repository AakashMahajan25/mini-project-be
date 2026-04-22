/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const nineMonthResult = sequelize.define(
        "nineMonthResult",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            COLUMNNAME: {
                type: DataTypes.STRING,
                allowNull: true
            },
            RID: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202312: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202212: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202112: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202012: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201912: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            rowno: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM,
                values: ['S', 'C'],
                allowNull: false,
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
            tableName: "nineMonthResult"
        }
    );

    nineMonthResult.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    nineMonthResult.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    nineMonthResult.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return nineMonthResult;
};

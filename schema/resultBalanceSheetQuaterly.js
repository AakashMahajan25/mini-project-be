/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const resultBalanceSheetQuarterly = sequelize.define(
        "resultBalanceSheetQuarterly",
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
            Y202309: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202303: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202209: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202203: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202109: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202103: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202009: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202003: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201909: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201903: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201809: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201803: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201709: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201703: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201609: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201603: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201509: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201503: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201409: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y201403: {
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
                allowNull: false
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
            tableName: "resultBalanceSheetQuarterly"
        }
    );

    resultBalanceSheetQuarterly.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    resultBalanceSheetQuarterly.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    resultBalanceSheetQuarterly.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return resultBalanceSheetQuarterly;
};

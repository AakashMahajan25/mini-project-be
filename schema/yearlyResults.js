/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const yearlyResults = sequelize.define(
        "yearlyResults",
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
            Y202403: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202303: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202203: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202103: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Y202003: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            rowno: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            cocode: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
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
            tableName: "yearlyResults"
        }
    );

    return yearlyResults;
};

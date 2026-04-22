const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const capitalStructure = sequelize.define(
        "capital_structure",
        {
            capital_structure_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            EquityAuthorised: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            EquityIssued: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            EquitySubs: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            FaceValue: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            EquitySharesPaidUp: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            EquityPaidUp: {
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
            tableName: "capital_structure"
        }
    );

    // Hook to update updatedAt field before bulk updates
    capitalStructure.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    capitalStructure.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return capitalStructure;
};

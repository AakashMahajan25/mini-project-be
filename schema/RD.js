const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const rDSchema = sequelize.define(
        "r_d",
        {
            r_d_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            CAPITAL: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            RECURRING: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            PERCENTAGE: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            YEAR: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            FLAG: {
                type: DataTypes.STRING,
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
            tableName: "r_d"
        }
    );

    // Hook to update updatedAt field before bulk updates
    rDSchema.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    rDSchema.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return rDSchema;
};

const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyLocations = sequelize.define(
        "company_locations",
        {
            company_locations_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TYPE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ADD1: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            ADD2: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            ADD3: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            CITY: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            PIN: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TEL1: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            FAX1: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            ST_NAME: {
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
            tableName: "company_locations"
        }
    );

    // Hook to update updatedAt field before bulk updates
    companyLocations.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    companyLocations.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return companyLocations;
};

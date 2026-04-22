const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const indexwiseCompanyMaster = sequelize.define(
        "indexwiseCompanyMaster",
        {
            indexwise_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CMOTSCode: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            indexCode:{
type:DataTypes.BIGINT,
allowNull:true
            },
            CompanyShortName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            CompanyLongName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            BSECode: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            NSESymbol: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ISIN: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            SectorName: {
                type: DataTypes.STRING,
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
            tableName: "indexwiseCompanyMaster"
        }
    );

    // Hook to update updatedAt field before bulk updates
    indexwiseCompanyMaster.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    indexwiseCompanyMaster.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    indexwiseCompanyMaster.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return indexwiseCompanyMaster;
};

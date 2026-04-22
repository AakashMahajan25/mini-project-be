const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const SectorWiseCompany = sequelize.define(
        "SectorWiseCompany",
        {
            listing_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
                Co_code:{  
                type:DataTypes.BIGINT,
                allowNull:true
                },
                sectorCode:{
type:DataTypes.BIGINT,
allowNull:true
                },
         co_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            lname: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            sc_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            symbol: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            sect_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            Exchange_BSE: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            Exchange_NSE: {
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
            tableName: "SectorWiseCompany"
        }
    );

    // Hook to update updatedAt field before bulk updates
    SectorWiseCompany.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    SectorWiseCompany .beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    SectorWiseCompany.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return SectorWiseCompany;
};

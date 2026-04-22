const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyMaster = sequelize.define(
        "company_master",
        {
            company_master_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            bsecode:{
                type: DataTypes.STRING,
                 allowNull: true,
                defaultValue:true
            },
            nsesymbol: {
                type: DataTypes.STRING,
                 allowNull: true,
                  defaultValue:true
            },
            companyname: {
                type: DataTypes.STRING,
                 allowNull: true,
                  defaultValue:true
            },
            companyshortname: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            categoryname: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            isin: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            bsegroup: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            mcaptype: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            sectorcode: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            sectorname: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            industrycode: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            industryname: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            bselistedflag: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            nselistedflag: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            displaytype: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            BSEStatus: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            NSEStatus: {
                type: DataTypes.STRING,
                allowNull: true,
                 defaultValue:true
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue : true
            },
            createdAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            },
            updatedAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            }
        },
        {
            tableName: "company_master"
        }
    );

    // Hook to update updatedAt field before bulk updates
    companyMaster.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    companyMaster.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return companyMaster;
};

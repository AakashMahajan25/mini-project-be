const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const auditorsReports = sequelize.define(
        "auditors_reports",
        {
            auditors_reports_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            LNAME:{
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue:true
            },
            MEMO:{
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue:true
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            Yr: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            symbol:{
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
            tableName: "auditors_reports"
        }
    );

    // Hook to update updatedAt field before bulk updates
    auditorsReports.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    auditorsReports.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return auditorsReports;
};

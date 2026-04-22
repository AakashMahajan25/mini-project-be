const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const directorsReport = sequelize.define(
        "directors_report",
        {
            directors_report_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LNAME:{
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue:true
            },
            DIRECTORREP:{
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue:true
            },
            yr: {
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
            tableName: "directors_report"
        }
    );

    // Hook to update updatedAt field before bulk updates
    directorsReport.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    directorsReport.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return directorsReport;
};

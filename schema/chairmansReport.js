const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const chairmansReport = sequelize.define(
        "chairmans_report",
        {
            chairmans_report_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            LNAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            CHAIRREPORT: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
            },
            Yr: {
                type: DataTypes.INTEGER,
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
            tableName: "chairmans_report"
        }
    );

    // Hook to update updatedAt field before bulk updates
    chairmansReport.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    chairmansReport.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return chairmansReport;
};

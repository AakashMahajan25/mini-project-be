const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const chairmansSpeechReport = sequelize.define(
        "chairmans_speech_report",
        {
            chairmans_speech_report_id: {
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
            COLL_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            COLL_CTRY: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            COLL_Country: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            PERC_SH: {
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
            tableName: "chairmans_speech_report"
        }
    );

    // Hook to update updatedAt field before bulk updates
    chairmansSpeechReport.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    chairmansSpeechReport.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return chairmansSpeechReport;
};

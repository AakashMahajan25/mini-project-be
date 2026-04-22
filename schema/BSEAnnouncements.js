/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const bseAnnouncements = sequelize.define(
        "bse_announcements",
        {
            bse_announcement_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            sc_code:{
                type: DataTypes.STRING,
                allowNull: true
            },
            symbol: {
                type: DataTypes.STRING,
                 allowNull: true
            },
            lname: {
                type: DataTypes.TEXT,
                 allowNull: true
            },
            caption: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            memo: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue : true
            },
            createdAt : {
                type: DataTypes.STRING,
                defaultValue: ()=> moment().utcOffset(0).toISOString(true),
            },
            updatedAt : {
                type: DataTypes.STRING,
                defaultValue: ()=> moment().utcOffset(0).toISOString(true),
            }
        },
        {
            tableName: "bse_announcements"
        }
    );

    // Hook to update updatedAt field before bulk updates
    bseAnnouncements.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    bseAnnouncements.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return bseAnnouncements;
};

/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const bseAnnouncements = sequelize.define(
        "book_closer",
        {
            book_closer_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            Co_name:{
                type: DataTypes.STRING(100),
                allowNull: true
            },
            symbol: {
                type: DataTypes.STRING(50),
                 allowNull: true
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            BCFromdate: {
                type: DataTypes.DATE,
                allowNull: false
            },    
            BCToDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            Agenda: {
                type: DataTypes.STRING(100),
                allowNull: true,
                primaryKey: true,
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
            tableName: "book_closer"
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

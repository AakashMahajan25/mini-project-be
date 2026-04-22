/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const boardMeetings = sequelize.define(
        "board_meetings",
        {
            board_meeting_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
            },
            co_name:{
                type: DataTypes.STRING(100),
                allowNull: false
            },
            symbol: {
                type: DataTypes.STRING(50),
                 allowNull: false
            },
            BMdate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            Description: {
                type: DataTypes.TEXT,
                allowNull: false,
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
            tableName: "board_meetings"
        }
    );

    // Hook to update updatedAt field before bulk updates
    boardMeetings.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    boardMeetings.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return boardMeetings;
};

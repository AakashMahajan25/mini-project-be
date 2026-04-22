/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const stories = sequelize.define(
        "stories",
        {
            story_id : {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            // story_type_id :{
            //     type: DataTypes.INTEGER,
            //     allowNull: false,
            //     references: {
            //         model: "users",
            //         key: "user_id",
            //     },
            // },  
            story_content : {
                type: DataTypes.TEXT,
                allowNull: false
            },
            story_image : {
                type: DataTypes.STRING,
                allowNull: true
            },
            expires_at: {
                type: DataTypes.STRING,
                allowNull: false
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
            tableName: "stories"
        }
    );

    return stories;
};

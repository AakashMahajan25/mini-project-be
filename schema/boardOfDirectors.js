const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const boardOfDirectors = sequelize.define(
        "board_of_directors",
        {
            board_of_directors_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            slno: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            dir_name:{
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue:true
            },
            dir_desg:{
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue:true
            },
            year: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
            tableName: "board_of_directors"
        }
    );

    // Hook to update updatedAt field before bulk updates
    boardOfDirectors.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    boardOfDirectors.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return boardOfDirectors;
};

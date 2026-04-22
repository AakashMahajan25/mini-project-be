const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const bankers = sequelize.define(
        "bankers",
        {
            bankers_id: {
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
            BNK_NAME:{
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
            tableName: "bankers"
        }
    );

    // Hook to update updatedAt field before bulk updates
    bankers.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    bankers.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return bankers;
};

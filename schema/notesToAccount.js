const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const notesToAccount = sequelize.define(
        "notes_to_account",
        {
            notes_to_account_id: {
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
            tableName: "notes_to_account"
        }
    );

    // Hook to update updatedAt field before bulk updates
    notesToAccount.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    notesToAccount.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return notesToAccount;
};

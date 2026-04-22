const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const managementBioData = sequelize.define(
        "management_bio_data",
        {
            management_bio_data_id: {
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
            tableName: "management_bio_data"
        }
    );

    // Hook to update updatedAt field before bulk updates
    managementBioData.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    managementBioData.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return managementBioData;
};

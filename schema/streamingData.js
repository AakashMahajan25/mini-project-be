const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const streamingData = sequelize.define(
        "streamingData",
        {
            streamingData_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            prompt_id:{
                type: DataTypes.BIGINT,
                allowNull: false,

            },
            prompt_history_id:{
                type: DataTypes.BIGINT,
                allowNull: false,
                
            },
            source_data :{
                type: DataTypes.JSON,
                allowNull: true
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
            tableName: "streamingData"
        }
    );

    // Hook to update updatedAt field before bulk updates
    streamingData.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    streamingData.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return streamingData;
};

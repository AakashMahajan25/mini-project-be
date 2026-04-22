const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const sourceData = sequelize.define(
        "source_data",
        {
            source_data_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            source_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            heading: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            title: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            youtube_summary: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            source_date: {
                type: DataTypes.STRING,
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
            tableName: "source_data"
        }
    );

    // Hook to update updatedAt field before bulk updates
    sourceData.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    sourceData.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return sourceData;
};

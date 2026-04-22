/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const capitalMarketNews = sequelize.define(
        "capitalMarketNews",
        {
            capitalMarketNewsId: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },

            sno: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            section_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            date: {
                type: DataTypes.STRING,
                allowNull: false
            },
            time: {
                type: DataTypes.STRING,
                allowNull: false
            },
            heading: {
                type: DataTypes.STRING,
                allowNull: false
            },
            caption: {
                type: DataTypes.STRING,
                allowNull: false
            },
            type:{
                type: DataTypes.ENUM,
                values: ['hotPursuit', 'corporateNews', 'marketBeat', 'economyNews', 'corporateResults', 'stockAlert', 'preSession', 'midSession', 'endSession'],
            },
            arttext: {
                type: DataTypes.TEXT,
                allowNull: false
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
            tableName: "capitalMarketNews"
        }
    );

     // Hook to update updated_at field before bulk updates
     capitalMarketNews.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    capitalMarketNews.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    capitalMarketNews.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return capitalMarketNews;
};

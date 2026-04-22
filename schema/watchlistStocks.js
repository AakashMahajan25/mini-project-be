/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const watchlistStocks = sequelize.define(
        "watchlist_stocks",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            watchlist_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "watchlists",
                    key: "watchlist_id",
                },
            },
            ticker: {
                type: DataTypes.STRING,
                allowNull: false
            },
            ticker_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            cocode: {
                type: DataTypes.INTEGER,
                allowNull : true
            },
            ticker_price: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_open:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_high:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_low:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_volume:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_latest_trading_day:{
                type: DataTypes.STRING,
                allowNull: true
            },
            ticker_previous_close:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_change:{
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ticker_change_percent:{
                type: DataTypes.STRING,
                allowNull: true
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
            tableName: "watchlist_stocks"
        }
    );

    // Hook to update updatedAt field before bulk updates
    watchlistStocks.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    watchlistStocks.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    watchlistStocks.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return watchlistStocks;
};

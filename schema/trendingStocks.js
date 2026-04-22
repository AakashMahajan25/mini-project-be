/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const trending_stocks = sequelize.define(
        "trending_stocks",
        {
            trending_stock_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            stock_ticker: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            stock_relevance: {
                type: DataTypes.STRING,
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
            tableName: "trending_stocks"
        }
    );

    // Hook to update updatedAt field before bulk updates
    trending_stocks.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    trending_stocks.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    trending_stocks.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return trending_stocks;
};

module.exports.us = function (sequelize, DataTypes) {
    const trending_stocks_us = sequelize.define(
        "trending_stocks_us",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false
            },
            country_code: {
                type: DataTypes.STRING(10),
                allowNull: false
            },
            data: {
                type: DataTypes.JSONB,
                allowNull: false
            }
        },
        {
            tableName: "trending_stocks_us",
            timestamps: false  // Disable automatic timestamp fields since we have 'timestamp'
        }
    );

    // Hook to update updatedAt field before bulk updates
    trending_stocks_us.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    trending_stocks_us.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    trending_stocks_us.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return trending_stocks_us;
};

module.exports.in = function (sequelize, DataTypes) {
    const trending_stocks_in = sequelize.define(
        "trending_stocks_in",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false
            },
            country_code: {
                type: DataTypes.STRING(10),
                allowNull: false
            },
            data: {
                type: DataTypes.JSONB,
                allowNull: false
            }
        },
        {
            tableName: "trending_stocks_in",
            timestamps: false  // Disable automatic timestamp fields since we have 'timestamp'
        }
    );

    // Hook to update updatedAt field before bulk updates
    trending_stocks_in.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    trending_stocks_in.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    trending_stocks_in.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return trending_stocks_in;
};
/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const eventCategoryItems = sequelize.define(
        "eventCategoryItems",
        {
            event_category_id : {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            event_id : {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "event_categories",
                    key: "category_id",
                },
            },
            title : {
                type: DataTypes.STRING,
                allowNull: false,
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
            tableName: "eventCategoryItems"
        }
    );

    // Hook to update updated_at field before bulk updates
    eventCategoryItems.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    eventCategoryItems.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    eventCategoryItems.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return eventCategoryItems;
};

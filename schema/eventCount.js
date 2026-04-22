const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const eventCounts = sequelize.define(
        "event_counts",
        {
            event_count_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            corptype: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            totalcount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            xdate: {
                type: DataTypes.DATE,
                allowNull: false,
                primaryKey: true
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: () => moment().utcOffset(0).toISOString(true),
                allowNull: true
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: () => moment().utcOffset(0).toISOString(true),
                allowNull: true
            }
        },
        {
            tableName: "event_counts",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    eventCounts.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return eventCounts;
};

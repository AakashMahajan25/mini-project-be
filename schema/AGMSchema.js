const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const AGM = sequelize.define(
        "agm",
        {
            agm_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            co_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            symbol: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            isin: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false,
                primaryKey: true,
            },
            GMdate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            Purpose: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            BCloserStartDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            BCloserEndDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            Description: {
                type: DataTypes.TEXT('long'),
                allowNull: true
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
            tableName: "agm",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    AGM.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return AGM;
};

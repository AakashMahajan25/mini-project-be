const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const splitsValue = sequelize.define(
        "splits",
        {
            split_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            co_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            symbol: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            isin: {
                type: DataTypes.STRING,
                allowNull: false
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            recorddate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            SplitDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            FVBefore: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            FVAfter: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            remark: {
                type: DataTypes.STRING(500),
                allowNull: false
            },
            SplitRatio: {
                type: DataTypes.STRING,
                allowNull: false
            },
            Description: {
                type: DataTypes.TEXT('long'),
                allowNull: false
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
            tableName: "splits",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    splitsValue.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return splitsValue;
};

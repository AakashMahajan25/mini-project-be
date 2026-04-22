const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const bonus = sequelize.define(
        "bonus_issues",
        {
            bonus_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            co_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            symbol: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            isin: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            RecordDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            BonusDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            BonusRatio: {
                type: DataTypes.STRING,
                allowNull: false
            },
            remark: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            Description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: false
            }
        },
        {
            tableName: "bonus_issues",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    bonus.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return bonus;
};

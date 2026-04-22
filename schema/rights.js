const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const rights = sequelize.define(
        "right_issues",
        {
            right_id: {
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
                allowNull: false
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            recorddate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            RightDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            RightsRatio: {
                type: DataTypes.STRING,
                allowNull: false
            },
            premium: {
                type: DataTypes.FLOAT,
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
            tableName: "right_issues",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    rights.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return rights;
};

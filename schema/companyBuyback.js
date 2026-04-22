const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const CompanyBuyback = sequelize.define(
        "company_buyback",
        {
            buyback_id: {
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
                primaryKey: true
            },
            symbol: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            isin: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false,
                primaryKey: true
            },
            BBFromdate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            BBToDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            offertype: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            maxbuybackprice: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            totalaggregateamount: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            Description: {
                type: DataTypes.TEXT('long'),
                allowNull: false
            },
            BuyBackDate: {
                type: DataTypes.DATE,
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
            tableName: "company_buyback",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    CompanyBuyback.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return CompanyBuyback;
};

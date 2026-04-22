const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const eventDetails = sequelize.define(
        "event_details",
        {
            event_detail_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            corp_type: {
                type: DataTypes.ENUM('bonus', 'split', 'dividend', 'bookcloser', 'buyback', 'result'),
                allowNull: false
            },
            co_code: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true
            },
            sc_code: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            symbol: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            co_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            isin: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            CurrentPrice: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            Pricediff: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            PerChange: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            TradeDate: {
                type: DataTypes.DATE,
                allowNull: false,
                primaryKey: true
            },
            BookCloserDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            agenda: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            Exchange: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            CompanyLongName: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            BonusDate:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            BonusRatio:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            DivDate:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            SplitDate:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            FV_From:  {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            FV_To:  {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            buybackDate:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            OfferType:  {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            MaxBuyBackPrice:  {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            ResultDate:  {
                type: DataTypes.DATE,
                allowNull: true
            },
            note:  {
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
            tableName: "event_details",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    eventDetails.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return eventDetails;
};

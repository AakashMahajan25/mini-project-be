const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyMerger = sequelize.define(
        "company_merger",
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
            ISIN: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            AnnouncementDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            Merger_Demerger_Date: {
                type: DataTypes.DATE,
                allowNull: false
            },
            recorddate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            mgrRatio: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            MergedInto_Code: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            MergedInto_ISIN: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            MergedIntoName: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            Type: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            INSTNAME: {
                type: DataTypes.STRING(100),
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
            tableName: "company_merger",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    companyMerger.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return companyMerger;
};

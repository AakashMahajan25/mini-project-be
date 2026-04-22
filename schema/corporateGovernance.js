const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const corporateGovernance = sequelize.define(
        "corporate_governance",
        {
            corporate_governance_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            Date: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            CorpGov_Report: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            tableName: "corporate_governance"
        }
    );

    // Hook to update updatedAt field before bulk updates
    corporateGovernance.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    corporateGovernance.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return corporateGovernance;
};

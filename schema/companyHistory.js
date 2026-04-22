const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyHistory = sequelize.define(
        "company_history",
        {
            company_history_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            LNAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            cocode: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            MEMO: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: true
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
            tableName: "company_history"
        }
    );

    // Hook to update updatedAt field before bulk updates
    companyHistory.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    companyHistory.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return companyHistory;
};

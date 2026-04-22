const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const chronologicalHistory = sequelize.define(
        "chronological_history",
        {
            chronological_history_id: {
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
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            EQTYASON: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            EQTY: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            REMARKS: {
                type: DataTypes.STRING,
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
            tableName: "chronological_history"
        }
    );

    // Hook to update updatedAt field before bulk updates
    chronologicalHistory.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    chronologicalHistory.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return chronologicalHistory;
};

const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const rawMaterials = sequelize.define(
        "raw_materials",
        {
            raw_materials_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
            PRNAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            UOM: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            QTY: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            VALUE: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            YEAR: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            symbol: {
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
            tableName: "raw_materials"
        }
    );

    // Hook to update updatedAt field before bulk updates
    rawMaterials.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    rawMaterials.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return rawMaterials;
};

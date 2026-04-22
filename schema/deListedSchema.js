const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const DeListed = sequelize.define(
        "delisted",
        {
            deListed_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            CO_NAME: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            Symbol: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            srdt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            FromDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: ()=> moment().utcOffset(0).toISOString(true),
                allowNull: true
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: ()=> moment().utcOffset(0).toISOString(true),
                allowNull: true
            }
        },
        {
            tableName: "delisted",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    DeListed.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return DeListed;
};

const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const finishedProducts = sequelize.define(
        "finished_products",
        {
            finished_products_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
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
            PER_SALE: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            INST: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PRODN: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            SALEQTY: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            SALEVAL: {
                type: DataTypes.FLOAT,
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
            tableName: "finished_products"
        }
    );

    // Hook to update updatedAt field before bulk updates
    finishedProducts.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    finishedProducts.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return finishedProducts;
};

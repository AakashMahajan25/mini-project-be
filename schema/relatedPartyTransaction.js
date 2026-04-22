const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const relatedPartyTransaction = sequelize.define(
        "related_party_transaction",
        {
            related_party_transaction_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            SLNO: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            NAT_TRANS: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ASSOC: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            SUBSI: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            KMP: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            RKMP: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            JV: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            IND: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            OTH: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            HC: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            TYPE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            SUBTYPE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            TOTAL: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            CLASS: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            FLAG: {
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
            tableName: "related_party_transaction"
        }
    );

    // Hook to update updatedAt field before bulk updates
    relatedPartyTransaction.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    relatedPartyTransaction.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return relatedPartyTransaction;
};

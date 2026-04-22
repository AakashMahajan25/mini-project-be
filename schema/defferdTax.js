const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const defferdTax = sequelize.define(
        "defferd_tax",
        {
            defferd_tax_id: {
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
            ASEG1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL1: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL2: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG3: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL3: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG4: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL4: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG5: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL5: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG6: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL6: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG7: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL7: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG8: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL8: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG9: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL9: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG10: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL10: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG11: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL11: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG12: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL12: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG13: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL13: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG14: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL14: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG15: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL15: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG16: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL16: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG17: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL17: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG18: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL18: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG19: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL19: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ASEG20: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AVAL20: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL1: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL2: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG3: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL3: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG4: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL4: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG5: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL5: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG6: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL6: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG7: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL7: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG8: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL8: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG9: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL9: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG10: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL10: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG11: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL11: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG12: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL12: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG13: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL13: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG14: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL14: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG15: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL15: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG16: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL16: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG17: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL17: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG18: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL18: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG19: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL19: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            LSEG20: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            LVAL20: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ATOTAL: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            LTOTAL: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            YEAR: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            FLAG: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
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
            tableName: "defferd_tax"
        }
    );

    // Hook to update updatedAt field before bulk updates
    defferdTax.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    defferdTax.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return defferdTax;
};

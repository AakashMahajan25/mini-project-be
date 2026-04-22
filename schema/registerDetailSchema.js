const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const registerDetail = sequelize.define(
        "registerDetail",
        {
            registerDetail_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            LNAME: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            ISIN: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            HSE_S_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            INC_DT: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REGADD1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REGADD2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REGDIST: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REGSTATE: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REGPIN: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            TEL1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ind_l_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            TEL2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            FAX1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            FAX2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            AUDITOR: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            FV: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            MKT_LOT: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            CHAIRMAN: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            CO_SEC: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            EMAIL: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            INTERNET: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dir_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dir_desg: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            co_code1: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ho_add1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_add2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_add3: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_stcode: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_pin: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ho_tel1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_tel2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_fax1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_fax2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_email: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ho_ctry_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            co_code2: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            co_code3: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            RCODE: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_ADD1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_ADD2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_ADD3: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_ADD4: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_TEL: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_FAX: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_EMAIL: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            REG_INTERNET: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            FLAG: {
                type: DataTypes.STRING,
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
            tableName: "registerDetail"
        }
    );

    // Hook to update updatedAt field before bulk updates
    registerDetail.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });
    registerDetail.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });
    // Hook to update updatedAt field before each update
    registerDetail.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return registerDetail;
};

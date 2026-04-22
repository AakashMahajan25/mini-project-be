const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyProfile = sequelize.define(
        "company_profile",
        {
            company_profile_id: {
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
            ISIN: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            HSE_S_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            INC_DT: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REGADD1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REGADD2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REGDIST: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REGSTATE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REGPIN: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            TEL1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ind_l_name: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            TEL2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            FAX1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            FAX2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            AUDITOR: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
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
                defaultValue: true
            },
            CO_SEC: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            CO_CODE: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            EMAIL: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            INTERNET: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            dir_name: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            dir_desg: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_code1: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ho_add1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_add2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_add3: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_city: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_stcode: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_statename: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_pin: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ho_tel1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_tel2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_fax1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_fax2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_email: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            ho_ctry_name: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_code2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_add1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_add2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_add3: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_city: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_stcode: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_statename: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_pin: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_tel1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_tel2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_fax1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_fax2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_email: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_ctry_name: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            co_code3: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            RCODE: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_ADD1: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_ADD2: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_ADD3: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_ADD4: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_TEL: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_FAX: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_EMAIL: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            REG_INTERNET: {
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
            tableName: "company_profile"
        }
    );

    // Hook to update updatedAt field before bulk updates
    companyProfile.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    companyProfile.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return companyProfile;
};

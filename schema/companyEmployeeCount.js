const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const companyEmployeeCount = sequelize.define(
        "company_employee_count",
        {
            company_employee_count_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            YRC: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TotalEmpoyee_Male: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TotalEmpoyee_Female: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TotalEmpoyee: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            TotalEmployee_Contractbasis: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PermenantWomenEmployee: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            PermenantDisabledEmployee: {
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
            tableName: "company_employee_count"
        }
    );

    // Hook to update updatedAt field before bulk updates
    companyEmployeeCount.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    companyEmployeeCount.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return companyEmployeeCount;
};

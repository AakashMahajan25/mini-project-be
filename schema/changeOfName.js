const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const changeOfName = sequelize.define(
        "name_change",
        {
            name_change_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            co_code: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            OLDNAME: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            newname: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            symbol: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            srdt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: () => moment().utcOffset(0).toISOString(true),
                allowNull: true
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: () => moment().utcOffset(0).toISOString(true),
                allowNull: true
            }
        },
        {
            tableName: "name_change",
            timestamps: false
        }
    );

    // Hook to update updatedAt field before each update
    changeOfName.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    });

    return changeOfName;
};

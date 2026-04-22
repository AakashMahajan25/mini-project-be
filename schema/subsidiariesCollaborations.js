const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const subsidiariesCollaborations = sequelize.define(
        "subsidiaries_collaborations",
        {
            subsidiaries_collaborations_id: {
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
            COLL_NAME: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            COLL_CTRY: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            COLL_Country: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: true
            },
            PERC_SH: {
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
            tableName: "subsidiaries_collaborations"
        }
    );

    // Hook to update updatedAt field before bulk updates
    subsidiariesCollaborations.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updatedAt field before each update
    subsidiariesCollaborations.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });


    return subsidiariesCollaborations;
};

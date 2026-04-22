/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const articleAuthors = sequelize.define(
        "articleAuthors",
        {
            article_author_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            article_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "newsArticles",
                    key: "article_id",
                },
            },
            author_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "authors",
                    key: "author_id",
                },
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
            tableName: "articleAuthors"
        }
    );

    return articleAuthors;
};

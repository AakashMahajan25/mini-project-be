/* jshint indent: 2 */
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    const newsArticles = sequelize.define(
        "newsArticles",
        {
            article_id : {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            headline : {
                type: DataTypes.STRING,
                allowNull: false
            },
            content : {
                type: DataTypes.TEXT,
                allowNull: false
            },
            source_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "news_sources",
                    key: "source_id",
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
            category: {
                type: DataTypes.STRING,
                allowNull: false
            },
            keywords: {
                type: DataTypes.STRING,
                allowNull: false
            },
            external_url : {
                type: DataTypes.STRING,
                allowNull: false
            },
            image_url : {
                type: DataTypes.STRING,
                allowNull: false
            },
            is_featured : {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue : true
            },
            createdAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            },
            updatedAt : {
                type: DataTypes.STRING,
                defaultValue: moment().utcOffset(0).toISOString(true),
            }
        },
        {
            tableName: "newsArticles"
        }
    );

    return newsArticles;
};

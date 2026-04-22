"use strict";
const { Sequelize } = require("sequelize");
const db = {};
let sequelize = null;
const path = require("path");
const fs = require("fs");
require('dotenv').config();

module.exports = {
    /**
     * Settings
     */
    settings: {
        adapterOptions: {
            dialect: 'postgres',
            timezone: 'UTC',
            pool: {
                max: 50,
                min: 0,
                idle: 10000
            },
            define: {
                freezeTableName: true,
                createdAt: false,
                updatedAt: false
            }
        }
    },

    methods: {
        async syncModels() {
            try {
                await db.sequelize.sync(); // Synchronize models with database schema
                this.logger.info("Database schema synchronized.");
                // Loop through the models and call the associate method
                for (const modelName of Object.keys(db)) {
                    if (db[modelName].associate) {
                        db[modelName].associate(db);
                    }
                }
                this.logger.info("Associations synchronized.");
            } catch (err) {
                this.logger.error("Error synchronizing database schema:", err);
            }
        },

        attachModels() {
            const schemaPath = path.join(__dirname, "../schema");

            fs.readdirSync(schemaPath)
                .filter(file => file.endsWith(".js"))
                .forEach(file => {
                    const schemaModule = require(path.join(schemaPath, file));

                    // Load main export
                    if (typeof schemaModule === 'function') {
                        const model = schemaModule(sequelize, Sequelize.DataTypes);
                        db[model.name] = model;
                    }

                    // Load additional exports (like .us, .in)
                    Object.keys(schemaModule).forEach(key => {
                        if (key !== 'default' && typeof schemaModule[key] === 'function') {
                            const model = schemaModule[key](sequelize, Sequelize.DataTypes);
                            db[model.name] = model;
                        }
                    });
                });
        },

        async connectToDb() {
            const uri = process.env.POSTGRES_URI;
            return new Promise(async (resolve, reject) => {
                try {
                    if (typeof uri != 'undefined') {
                        sequelize = new Sequelize(uri, this.settings.adapterOptions);
                        await sequelize.authenticate();
                        this.attachModels();
                        db.sequelize = sequelize;
                        db.Sequelize = Sequelize;
                        resolve(db);
                    } else {
                        reject("Connection String not found");
                    }

                } catch (err) {
                    reject(err);
                }
            });
        }
    },

    async started() {
        try {
            const db = await this.connectToDb();
            this.db = db;
            this.logger.info("Database connection established.");
            // await this.syncModels(); 
        } catch (err) {
            this.logger.error("Error connecting to the database:", err);
            // Set db to null to indicate connection failure
            this.db = null;
        }
    },
}
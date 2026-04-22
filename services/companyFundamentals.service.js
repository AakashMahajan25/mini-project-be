"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin.js");
const { insertMany, findAndInsertMany, findAll } = require("../utils/postgresUtils.js");
const { generateResponse } = require("../utils/utility.js");
const { default: axios } = require('axios');
require('dotenv').config();
const { Sequelize } = require("sequelize");
const { getCompanyProfileValidation, getCapitalStructureValidation } = require('../validation/companyMasterValidation.js');

/** @type {ServiceSchema} */
module.exports = {
    name: "companyFundamentals",
    mixins: [
        DbService
    ],
    /**
     * Settings
     */
    settings: {

    },

    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        getCompanyMaster: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyMaster"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyMaster : Service Starting`);

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CompanyMaster`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['company_master'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company Master Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company Master Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getCompanyMaster : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCompanyProfile: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyProfile"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyProfile : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCompanyProfile : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CompanyProfile/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['company_profile'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company Profile Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company Profile Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getCompanyProfile : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCompanyBackground: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyBackground"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyBackground : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCompanyBackground : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CompBackground/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['company_background'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company Background Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company Background Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getCompanyBackground : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getBoardOfDirectors: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getBoardOfDirectors"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getBoardOfDirectors : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getBoardOfDirectors : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BoardOfDirectors/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['board_of_directors'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Board Of Directors Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Board Of Directors Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getBoardOfDirectors : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getDirectorsReport: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getDirectorsReport"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getDirectorsReport : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getDirectorsReport : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/DirectorsReports/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['directors_report'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Directors Report Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Directors Report Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getDirectorsReport : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getChairmansReport: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getChairmansReport"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getChairmansReport : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getChairmansReport : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ChairmansReport/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['chairmans_report'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Chairmans Report Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Chairmans Report Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > getChairmansReport : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getBankers: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getBankers"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getBankers : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getBankers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Bankers/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['bankers'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Bankers Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Bankers Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getBankers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getManagementBioData: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getManagementBioData"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getManagementBioData : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getManagementBioData : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Biodata/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['management_bio_data'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'ManagementBioData Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No ManagementBioData Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getManagementBioData : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getAuditorsReports: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAuditorsReports"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getAuditorsReports : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getAuditorsReports : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/AuditorsReports/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['auditors_reports'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Auditors Reports Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Auditors Reports Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getAuditorsReports : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getNotesToAccount: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getNotesToAccount"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getNotesToAccount : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getNotesToAccount : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/NotesToAccount/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['notes_to_account'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Notes To Account Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Notes To Account Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getNotesToAccount : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getFinishedProducts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getFinishedProducts"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getFinishedProducts : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getFinishedProducts : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/FinishedProducts/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['finished_products'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Finished Products Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Finished Products Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getFinishedProducts : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getRawMaterials: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getRawMaterials"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getRawMaterials : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getRawMaterials : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/RawMaterials/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['raw_materials'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Raw Materials Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Raw Materials Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getRawMaterials : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getRelatedPartyTransaction: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getRelatedPartyTransaction"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getRelatedPartyTransaction : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getRelatedPartyTransaction : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Related_Party_Transaction/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['related_party_transaction'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Related Party Transaction Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Related Party Transaction Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getRelatedPartyTransaction : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getSubsidiariesCollaborations: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSubsidiariesCollaborations"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getSubsidiariesCollaborations : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getSubsidiariesCollaborations : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Subsidiaries_JVs_Collaborations/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['subsidiaries_collaborations'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Subsidiaries Collaborations Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Subsidiaries Collaborations Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getSubsidiariesCollaborations : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getDefferdTax: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getDefferdTax"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getDefferdTax : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getDefferdTax : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Deferred_Tax/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['defferd_tax'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Defferd Tax Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Defferd Tax Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getDefferdTax : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getRDData: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getRDData"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getRDData : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getRDData : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/R_and_D/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['r_d'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'R & D Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No R & D Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getRDData : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getChairmansSpeechReport: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getChairmansSpeechReport"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getChairmansSpeechReport : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getChairmansSpeechReport : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Chairmans_Speech/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['chairmans_speech_report'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Chairmans Speech Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Chairmans Speech Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getChairmansSpeechReport : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getChronologicalHistory: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getChronologicalHistory"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getChronologicalHistory : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getChronologicalHistory : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ChronologicalHistory/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['chronological_history'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Chronological History Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Chronological History Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getChronologicalHistory : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        syncCompanyHistory: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/syncCompanyHistory"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > syncCompanyHistory : Service Starting`);

                    const companyMasterData = await findAll(this.db['company_master'], { isActive: true }, { selectionAttribute: ['co_code'] });
                    if (companyMasterData.length < 1) {
                        transaction.rollback();
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'No Company Record Found');
                    }

                    let allResponses = [];
                    const token = process.env.TOKEN;

                    for (const data of companyMasterData) {                        
                        const response = await axios.get(`http://airrchipapis.cmots.com/api/CompanyHistory/${data.co_code}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                        });

                        if (response.data.success === true && response.data.data) {
                            let resp = response.data.data.map(item => {
                                item.cocode = data.co_code;
                                return item;
                            });
                            allResponses = allResponses.concat(resp);
                        }
                    }

                    if (allResponses.length > 0) {
                        await insertMany(this.db['company_history'], allResponses , { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company History Sync successfully', allResponses);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company History Found');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`company > syncCompanyHistory : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCompanyHistory: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyHistory"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyHistory : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCompanyHistory : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CompanyHistory/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true && response.data.data) {
                        let resp = response.data.data.map(item => {
                            item.cocode = cocode;
                            return item;
                        });
                        await insertMany(this.db['company_history'], resp, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company History Fetched successfully', resp);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company History Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCompanyHistory : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCompanyLocations: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyLocations"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyLocations : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCompanyLocations : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/locations/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['company_locations'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Company Location Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Company Location Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCompanyLocations : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCreditRatingInfo: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCreditRatingInfo"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCreditRatingInfo : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCreditRatingInfo : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CreditRatingInfo/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['credit_rating_info'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Credit Rating Info Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Credit Rating Info Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCreditRatingInfo : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCompanyEmployeeCount: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyEmployeeCount"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCompanyEmployeeCount : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCompanyEmployeeCount : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/EmployeeCount/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['company_employee_count'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Employee Count Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Employee Count Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCompanyEmployeeCount : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCapitalStructure: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCapitalStructure"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCapitalStructure : Service Starting`);
                    const validate = getCapitalStructureValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCapitalStructure : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode, count } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/capital-structure/${cocode}/${count}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        // await findAndInsertMany(this.db['capital_structure'], response.data.data, (row) => ({ YRC: row.YRC,co_code: row.co_code }), transaction)
                        await insertMany(this.db['capital_structure'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Capital Structure Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Capital Structure Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCapitalStructure : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getCorporateGovernance: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCorporateGovernance"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getCorporateGovernance : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getCorporateGovernance : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CorporateGovernance/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        // await findAndInsertMany(this.db['capital_structure'], response.data.data, (row) => ({ YRC: row.YRC,co_code: row.co_code }), transaction)
                        await insertMany(this.db['corporate_governance'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Capital Structure Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Capital Structure Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getCorporateGovernance : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getPledgeSharesDetails: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPledgeSharesDetails"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`company > getPledgeSharesDetails : Service Starting`);
                    const validate = getCompanyProfileValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`company > getPledgeSharesDetails : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Pledgesharesdetails/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        // await findAndInsertMany(this.db['capital_structure'], response.data.data, (row) => ({ YRC: row.YRC,co_code: row.co_code }), transaction)
                        await insertMany(this.db['pledge_shares_details'], response.data.data, { transaction });
                        transaction.commit();
                        return generateResponse(true, 'Capital Structure Fetched successfully', response.data.data);
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Capital Structure Found');
                    }

                } catch (error) {
                    console.log('error', error)
                    transaction.rollback();
                    this.logger.info(`company > getPledgeSharesDetails : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
    },

    /**
     * Events
     */
    events: {

    },

    /**
     * Methods
     */
    methods: {

    },

    /**
     * Service created lifecycle event handler
     */
    created() {

    },

    /**
     * Service started lifecycle event handler
     */
    async started() {
    },

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {

    }
};

/* jshint indent: 2 */
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
    const shareHoldingPattern = sequelize.define(
        "shareHoldingPattern",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            co_code: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            YRC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMFRCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMFRCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMFRCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMFRCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFRINDV: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFRINDV: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPFRINDV: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPFRINDV: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFRINST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFRINST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPFRINST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPFRINST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFROTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFROTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPFROTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPFROTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMFSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMFSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDFIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDFIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDFIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDFIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDIND: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDIND: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDIND: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDIND: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDFIRM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDFIRM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDFIRM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDFIRM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDCONC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDCONC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDCONC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDCONC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDTRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDTRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDTRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDTRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMINDOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMINDOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMINDOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMINDOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            GPMSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalPromoter_Shares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalPromoter_PerShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalPromoter_PledgeShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalPromoter_PerPledgeShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIGOVT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPICLMEM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPICLMEM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPICOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPICOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFDI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFDI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFBK: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFCOL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFCOL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFII: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFII: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFVEN: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFVEN: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIFOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIFOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIINS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIINS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIMF: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIMF: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPINRI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPINRI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPINSDL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPINSDL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPITRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPITRUS: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPIVEN: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPIVEN: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPISUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPISUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPCLMEM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPCLMEM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPDIR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPEMP: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPEMP: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPESCROW: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPESCROW: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFCOB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFDI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFDI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPNRI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPNRI: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPFOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPFOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPHUF: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPHUF: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPINDPUB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPINDPUB: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPINDM1L: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPINDM1L: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPINDL1L: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPINDL1L: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPMM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPMM: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPNDSL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPNDSL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPTRANSIT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPTRANSIT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPSOC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPSOC: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPTRUST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPTRUST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NPSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PPSUBTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalNonPromoter_Shares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            TotalNonPromoter_PerShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Total_Promoter_NonPromoter_Shares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Total_Promoter_NonPromoter_PerShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Total_Promoter_NonPromoter_PledgeShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Total_Promoter_NonPromoter_PerPledgeShares: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NADR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PADR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NGDR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PGDR: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NCUSTOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PCUSTOTH: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NCUST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PCUST: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            NGRTOTAL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PGRTOTAL: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            LPMOTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            PLPCGTOT: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Total_NoofShareholders: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Promoters_Holding: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            FIIs_Holding: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            DIIs_Holding: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            Public_Holding: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            cocode: {
                type: DataTypes.BIGINT,
                allowNull: false
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
            tableName: "shareHoldingPattern"
        }
    );

    shareHoldingPattern.beforeBulkUpdate((options) => {
        options.individualHooks = true; // Enable individual hooks for each record in the bulk update
    });

    // Hook to update created_at field before each update
    shareHoldingPattern.beforeCreate((instance, options) => {
        instance.createdAt = moment().utcOffset(0).toISOString(true);
    });

    // Hook to update updated_at field before each update
    shareHoldingPattern.beforeUpdate((instance, options) => {
        instance.updatedAt = moment().utcOffset(0).toISOString(true);
    });

    return shareHoldingPattern;
};

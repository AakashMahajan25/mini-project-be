"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { fetchStockDetails } = require('../utils/polygonHelper');
const { searchStock , getStatictics, getQuote, getCompanyDetails} = require('../utils/alphavantageHelper');
const { generateResponse } = require("../utils/utility.js");
const { stockDetailsValidation, getStockBySearch, getStockStatistics, cocodeValidation } = require('../validation/stocksValidation');
const { rawQuery, findAndInsertMany, findAll, updateRecords, create, findOne } = require('../utils/postgresUtils');
require('dotenv').config();
const { Sequelize } = require("sequelize");

/** @type {ServiceSchema} */
module.exports = {
    name: "stocks",
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
        trending: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/trending"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`stock > trending stock : Service Starting `);

                    // Get market from query params, default to "IN"
                    const market = ctx.params.query?.market || "IN";

                    // Select appropriate table based on market
                    const tableName = market === "US" ? 'trending_stocks_us' : 'trending_stocks_in';

                    this.logger.info(`Fetching trending stocks for market: ${market}, table: ${tableName}`);

                    // Query the database for trending stocks
                    let trendingStocks;
                    if (tableName === 'trending_stocks_in') {
                        trendingStocks = await rawQuery(this.db.sequelize, `SELECT * FROM trending_stocks_in ORDER BY timestamp DESC LIMIT 1`);
                        this.logger.info(`Found ${trendingStocks?.length || 0} records from trending_stocks_in`);
                    } else if (tableName === 'trending_stocks_us') {
                        trendingStocks = await rawQuery(this.db.sequelize, `SELECT * FROM trending_stocks_us ORDER BY timestamp DESC LIMIT 1`);
                        this.logger.info(`Found ${trendingStocks?.length || 0} records from trending_stocks_us`);
                    } else {
                        trendingStocks = await findAll(this.db[tableName], { isActive: true });
                        this.logger.info(`Found ${trendingStocks?.length || 0} records from ${tableName}`);
                    }

                    if (trendingStocks && trendingStocks.length > 0) {
                        if (tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') {
                            // Transform JSON data to expected format for both IN and US tables
                            const transformedData = [];
                            trendingStocks.forEach(record => {
                                if (record.data && record.data.trending_stocks) {
                                    record.data.trending_stocks.forEach(stock => {
                                        transformedData.push({
                                            name: stock.stock,
                                            stock_ticker: stock.stock,
                                            reason: stock.reason,
                                            stock_relevance: stock.percentage_change,
                                            isActive: true,
                                            createdAt: record.timestamp.toISOString(),
                                            updatedAt: record.timestamp.toISOString()
                                        });
                                    });
                                }
                            });

                            this.logger.info(`Transformed ${transformedData.length} stocks from ${tableName}`);
                            return generateResponse(true, 'Trending stocks fetched successfully', transformedData);
                        } else {
                            this.logger.info(`Returning ${trendingStocks.length} stocks from ${tableName}`);
                            return generateResponse(true, 'Trending stocks fetched successfully', trendingStocks);
                        }
                    }

                    ctx.meta.$statusCode = 400;
                    this.logger.info(`No trending stocks found for market: ${market}`);
                    return { status: false, message: 'No data found' };

                } catch (error) {
                    console.log('error=======', error)
                    this.logger.error(`stock > Trending stocks : Internal Server Error : ${error.message || error}`);

                    // Check if it's a table not found error
                    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
                        ctx.meta.$statusCode = 500;
                        return generateResponse(false, `Table ${tableName} does not exist in database. Please create the table first.`);
                    }

                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Internal Server Error');
                }
            }
        },

        getTrendingDashboardData: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTrendingDashboardData"
            },
            /*
            Get data from trending dashboard tables
            Query Parameters:
            - market: "US" | "IN" (optional, default: "IN")
            Usage:
            - GET /api/stocks/getTrendingDashboardData (defaults to IN market)
            - GET /api/stocks/getTrendingDashboardData?market=US
            - GET /api/stocks/getTrendingDashboardData?market=IN
            */
            async handler(ctx) {
                try {
                    // Get market from query params, default to "IN"
                    const market = ctx.params.query?.market || "IN";

                    // Select appropriate table based on market
                    const tableName = market === "US" ? 'trending_dashboard_us' : 'trending_dashboard_in';

                    this.logger.info(`Getting trending dashboard data for market: ${market}, using table: ${tableName}`);

                    // Query to get all data from the selected table
                    const dashboardData = await rawQuery(this.db.sequelize, `SELECT * FROM ${tableName} ORDER BY timestamp DESC`);

                    if (dashboardData && dashboardData.length > 0) {
                        this.logger.info(`Found ${dashboardData.length} records in ${tableName}`);

                        return generateResponse(true, `Trending dashboard data fetched successfully for ${market} market`, {
                            data: dashboardData,
                            market: market,
                            table: tableName,
                            count: dashboardData.length
                        });
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, `No data found in ${tableName} table for ${market} market`);
                    }

                } catch (error) {
                    this.logger.error(`Error getting trending dashboard data: ${error.message || error}`);

                    // Check if the table exists
                    const tableName = ctx.params.query?.market === "US" ? 'trending_dashboard_us' : 'trending_dashboard_in';
                    if (error.message && error.message.includes(`relation "${tableName}" does not exist`)) {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, `Table ${tableName} does not exist in database`);
                    }

                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Internal Server Error');
                }
            }
        },

        fetchTrendingStocksFromAI: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/fetchTrendingStocksFromAI"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`stock > trending stock : Service Starting `);

                    // Get market from query params or headers, default to "IN"
                    const market = ctx.params.query?.market || ctx.meta.headers?.['x-market'] || "IN";

                    // Select appropriate table based on market
                    const tableName = market === "US" ? 'trending_stocks_us' : 'trending_stocks_in';

                    // For trending_stocks_in and trending_stocks_us tables, check if records exist (data has trending_stocks array)
                    let existingStocks;
                    if (tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') {
                        existingStocks = await rawQuery(this.db.sequelize, `SELECT * FROM ${tableName} WHERE data->'trending_stocks' IS NOT NULL`);
                    } else {
                        existingStocks = await findAll(this.db[tableName], { isActive: true });
                    }

                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
                    const day = String(today.getDate()).padStart(2, '0'); // Add leading zero if needed
                    const todayDate = `${year}-${month}-${day}`;
                    let url = `https://ai.airrchip.com/dashboard/trending`
                    let temp = null
                    let trendingStocksCreatedDate = []
                    const trendingStocks = await findAll(this.db[tableName], { isActive: true })
                    
                    // Get API key from environment variable
                    const apiKey = process.env.PYTHON_AI_API_KEY || 'example_api_key_12345';
                    
                    await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-API-Key': apiKey,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.json())
                        .then(async (data) => {
                            this.logger.info(`News > Trending News : Data Fetched Successfully`);
                            temp = data;

                        })
                        .catch(error => {
                                this.logger.info(`News > Trending news : 'Unable to fetch trending stocks'`);
                                ctx.meta.$statusCode = 400;
                                return generateResponse(false, 'Unable to fetch stocks', error);
                        });


                    if (existingStocks && existingStocks.length > 0) {
                        existingStocks.forEach(element => {
                            if (tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') {
                                // For trending_stocks_in and trending_stocks_us, check timestamp field
                                if (element.timestamp) {
                                    trendingStocksCreatedDate.push(element.timestamp.toISOString().split('T')[0]);
                                }
                            } else {
                                // For other tables, check createdAt field
                                if (element.createdAt) {
                                    trendingStocksCreatedDate.push(element.createdAt);
                                }
                            }
                        });
                    }

                    // For trending_stocks_in and trending_stocks_us, we need to return the data in the expected format
                    if ((tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') && existingStocks && existingStocks.length > 0) {
                        // Transform the data from JSON structure to API response format
                        const transformedData = [];
                        existingStocks.forEach(record => {
                            if (record.data && record.data.trending_stocks) {
                                record.data.trending_stocks.forEach(stock => {
                                    transformedData.push({
                                        name: stock.stock,
                                        stock_ticker: stock.stock, // You might need to extract ticker differently
                                        reason: stock.reason,
                                        stock_relevance: stock.percentage_change,
                                        isActive: true,
                                        createdAt: record.timestamp.toISOString(),
                                        updatedAt: record.timestamp.toISOString()
                                    });
                                });
                            }
                        });

                        if (transformedData.length > 0) {
                            return generateResponse(true, 'Trending stocks fetched successfully', transformedData);
                        } else {
                            ctx.meta.$statusCode = 400;
                            return { status: false, message: 'No data found' };
                        }
                    }

                    const isNewTrending = trendingStocksCreatedDate.some(date => date.includes(todayDate));
                    if (!isNewTrending) {
                        if (tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') {
                            // For trending_stocks_in and trending_stocks_us, insert data in the expected JSON format
                            const trendingStocksData = {
                                trending_stocks: temp.map(row => ({
                                    stock: row.name,
                                    reason: row.reason || "Could not determine the reason from search results.",
                                    source: "",
                                    percentage_change: row.stock_relevance || "+0.0%"
                                })),
                                last_updated_utc: today.toISOString()
                            };

                            await findAndInsertMany(this.db[tableName], [trendingStocksData], (data) => ({
                                timestamp: today,
                                country_code: market,
                                data: data
                            }));
                        } else {
                            await updateRecords(this.db[tableName], { isActive: false }, { isActive: true });
                            await findAndInsertMany(this.db[tableName], temp, (row) => ({ name: row.name, stock_ticker: row.stock_ticker, createdAt: `${today}` }));
                        }
                        return generateResponse(true, 'New Data Added for today');
                    }
                    else{
                        if (tableName === 'trending_stocks_in' || tableName === 'trending_stocks_us') {
                            // For trending_stocks_in and trending_stocks_us, insert data in the expected JSON format
                            const trendingStocksData = {
                                trending_stocks: temp.map(row => ({
                                    stock: row.name,
                                    reason: row.reason || "Could not determine the reason from search results.",
                                    source: "",
                                    percentage_change: row.stock_relevance || "+0.0%"
                                })),
                                last_updated_utc: today.toISOString()
                            };

                            await findAndInsertMany(this.db[tableName], [trendingStocksData], (data) => ({
                                timestamp: today,
                                country_code: market,
                                data: data
                            }));
                        } else {
                            await findAndInsertMany(this.db[tableName], temp, (row) => ({ name: row.name, stock_ticker: row.stock_ticker}));
                        }
                        return generateResponse(true, 'updated todays data');
                    }


                } catch (error) {
                    console.log('error=======', error)
                    this.logger.error(`stock > Fetch Trending stocks : Internal Server Error : ${error.message || error}`);

                    // Check if it's a table not found error
                    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
                        ctx.meta.$statusCode = 500;
                        return generateResponse(false, `Table ${tableName} does not exist in database. Please create the table first.`);
                    }

                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Internal Server Error');
                }
            }
        },

        getGraphDetail: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getGraphDetail"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stock > stock getGraphDetail : Service Starting `);
                    const validation = stockDetailsValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getGraphDetail : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const apiKey = process.env.POLYGON_API_KEY;
                    if (!apiKey) {
                        return generateResponse(false, `API KEY not found, Please provide API KEY`);
                    } else {
                        ctx.params.query.apiKey = apiKey;
                    }

                    const response = await fetchStockDetails(ctx.params.query, this.logger);
                    if (response) {
                        this.logger.info(`stock > getGraphDetail : Data Fetched Successfully ${JSON.stringify(response)}`);
                        const resp = await generateResponse(true, 'Data fetched successfully', response);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch graph details');
                    }
                } catch (error) {
                    this.logger.info(`Stock > getGraphDetail : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getStockBySearch: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getStockBySearch"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`stocks > Searched stocks : Service Starting `);

                    const validate = getStockBySearch.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { keyword } = ctx.params.query;
                   
                    let temp = null;

                    // const response = await searchStock(keyword, this.logger);
                    // if (response.bestMatches) {
                    //     temp = response.bestMatches.map(match => ({
                    //         symbol: match["1. symbol"],
                    //         name: match["2. name"]
                    //     }));
                    // } else {
                    //     temp = [];
                    // }

                    const keywordTerms = keyword.trim().split(" "); // Split the keyword into multiple terms

                    const whereCondition = {
                        isActive: true,
                        [Sequelize.Op.and]: keywordTerms?.map(term => ({
                            [Sequelize.Op.or]: [
                                { nsesymbol: { [Sequelize.Op.iLike]: `%${term}%` } },
                                { companyname: { [Sequelize.Op.iLike]: `%${term}%` } }
                            ]
                        }))
                    };

                    const stocksData =  await findAll(this.db['company_master'], whereCondition)

                    // const stocksData =  await findAll(this.db['company_master'], {isActive: true, nsesymbol: { [Sequelize.Op.iLike]: `%${keyword}%`}, companyname: { [Sequelize.Op.iLike]: `%${keyword}%`}})


                    return generateResponse(true, 'Searched stocks fetched successfully', stocksData);

                } catch (error) {
                    this.logger.info(`stock > Searched stocks : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getStockStatistics: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getStockStatistics"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`stocks > Stocks Statistics : Service Starting `);
                    
                    const validate = getStockStatistics.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockStatistics : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    
                    const { symbol } = ctx.params.query;
                    
                    const staticticsResponse = getStatictics(symbol, this.logger);
                    const quoteResponse = getQuote(symbol, this.logger);

                    const [response1, response2] = await Promise.all([
                        staticticsResponse,
                        quoteResponse
                    ]);
                    
                    if (response1 && response2) {
                        const combinedData = {
                            Name: response1.Name,
                            MarketCapitalization: response1.MarketCapitalization,
                            High: response2['Global Quote']['03. high'],
                            Low: response2['Global Quote']['04. low'],
                            "52WeekHigh": response1["52WeekHigh"],
                            "52WeekLow": response1["52WeekLow"],
                            Volume: response2['Global Quote']['06. volume'],
                            RevenueTTM: response1.RevenueTTM,
                            BookValue: response1.BookValue,
                            PERatio: response1.PERatio,
                            DividendYield: response1.DividendYield,
                            ReturnOnEquityTTM: response1.ReturnOnEquityTTM,
                        };
        
                        return generateResponse(true, 'Stocks Statistics fetched successfully', combinedData);
                    } else {
                        this.logger.info(`stocks > Stocks Statistics : 'Unable to fetch Stocks Statistics' ${JSON.stringify(response1)}`);
                        this.logger.info(`stocks > Stocks Statistics : 'Unable to fetch Stocks Statistics' ${JSON.stringify(response2)}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Unable to fetch Stocks Statistics', 'Error fetching data from APIs');
                    }
                    
                } catch (error) {
                    this.logger.info(`stock > Stocks Statistics: Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getCompanyDetail: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCompanyDetail"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stock > stock getCompanyDetail : Service Starting `);
                    const validation = getStockStatistics.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getCompanyDetail : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const apiKey = process.env.AICHAT_KEY;
                    if (!apiKey) {
                        return generateResponse(false, `API KEY not found, Please provide API KEY`);
                    } else {
                        ctx.params.query.apiKey = apiKey;
                    }

                    const {symbol} = ctx.params.query;

                    const response = await getCompanyDetails(symbol, this.logger);
                    if (response) {
                        this.logger.info(`stock > getCompanyDetail : Data Fetched Successfully ${JSON.stringify(response)}`);
                        const resp = await generateResponse(true, 'Data fetched successfully', response);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch graph details');
                    }
                } catch (error) {
                    this.logger.info(`Stock > getCompanyDetail : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getSectors: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/sp500"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > Get Sectors : Service Starting `);

                    const url = `${process.env.AI_URL}sp500`

                    const sectors = await fetch(url);
                    const data = await sectors.json();

                    if (sectors.status === 200 && sectors.statusText === 'OK') {
                        this.logger.info(`Stocks > Get Sectors : Data Fetched Successfully ${JSON.stringify(data)}`);
                        const resp = generateResponse(true, 'Data fetched successfully', data);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch sectors');
                    }

                } catch (error) {
                    if ((error.code === "ECONNREFUSED") || (error.cause.code === "ECONNREFUSED")) {
                        ctx.meta.$statusCode = 503; 
                        return generateResponse(false, 'Connection refused. Please try again later.');
                    }
                    this.logger.info(`Stocks > Get Sectors : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        getStocksBySector: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/sp500/filter"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > Get Sectors : Service Starting `);
                    const {sector} = ctx.params.query

                    const url = `${process.env.AI_URL}sp500/sector?sector=${sector}`

                    const sectors = await fetch(url);
                    const data = await sectors.json();

                    if (sectors.status === 200 && sectors.statusText === 'OK') {
                        this.logger.info(`Stocks > Get Sectors : Data Fetched Successfully ${JSON.stringify(data)}`);
                        const resp = generateResponse(true, 'Data fetched successfully', data);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch stocks based on sectors');
                    }

                } catch (error) {
                    if ((error.code === "ECONNREFUSED") || (error.cause.code === "ECONNREFUSED")) {
                        ctx.meta.$statusCode = 503; 
                        return generateResponse(false, 'Connection refused. Please try again later.');
                    }
                    this.logger.info(`Stocks > Get Sectors : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        getPrompts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPrompts"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > Get Prompts : Service Starting `);
                    const {num} = ctx.params.query
                    const { user_id } = ctx.meta.user;

                    const watchlistQuery = `SELECT w."watchlist_id", w."user_id", w."isActive" AS watchlist_active, ws."ticker", ws."ticker_name", ws."isActive"
                            FROM watchlists AS w INNER JOIN watchlist_stocks AS ws ON w."watchlist_id" = ws."watchlist_id" WHERE w."user_id" = ${user_id} AND
                            w."isActive" = true AND ws."isActive" = true;`

                    const getWatchlistStocks = await rawQuery(this.db['sequelize'], watchlistQuery)
                    const tickers = getWatchlistStocks.map(item => item.ticker_name);

                    const url = `${process.env.AI_URL}generate_prompts?num=10`
                    const requestData = { stock_names: tickers };

                    const prompts = await fetch(url)
                    // , {
                    //     method: 'GET',
                    //     headers: {
                    //       'API-Key': process.env.AICHAT_KEY,
                    //       'Content-Type': 'application/json'
                    //     },
                    //     // body: JSON.stringify(requestData)
                    // })
                    
                    if (prompts.status === 200 && prompts.statusText == 'OK') {
                        const promptsData = await prompts.json();
                        for (const prompt of promptsData?.prompts) {
                            await create(this.db['suggestion_prompt'], {
                                prompt_text: prompt.Prompt,
                                prompt_description: prompt.Definition
                            });
                        }
                        this.logger.info(`Stocks > Get Prompts : Prompts Fetched Successfully ${JSON.stringify(prompts)}`);
                        const resp = generateResponse(true, 'Prompts fetched successfully', promptsData?.prompts);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch prompts');
                    }

                } catch (error) {
                    if ((error?.code === "ECONNREFUSED") || (error?.cause?.code === "ECONNREFUSED")) {
                        ctx.meta.$statusCode = 503; 
                        return generateResponse(false, 'Connection refused. Please try again later.');
                    }
                    this.logger.info(`Stocks > Get Prompts : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        getIndexes: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/indexes"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > Get Indexes : Service Starting `);

                    const url = `${process.env.AI_URL}indexes`

                    const indexes = await fetch(url);
                    const data = await indexes.json();

                    if (indexes.status === 200 && indexes.statusText === 'OK') {
                        this.logger.info(`Stocks > Get Indexes : Indexes Fetched Successfully ${JSON.stringify(data)}`);
                        const resp = generateResponse(true, 'Indexes fetched successfully', data);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch Indexes');
                    }

                } catch (error) {
                    if ((error.code === "ECONNREFUSED") || (error.cause.code === "ECONNREFUSED")) {
                        ctx.meta.$statusCode = 503; 
                        return generateResponse(false, 'Connection refused. Please try again later.');
                    }
                    this.logger.info(`Stocks > Get Indexes : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        getSuggestionPrompts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSuggestionPrompts"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > Get Indexes : Service Starting `);

                    const response = await findAll(this.db['suggestion_prompt'], { isActive: true })
                    const shuffled = response?.sort(() => 0.5 - Math.random());
                    const selected = shuffled?.slice(0, 10);
                    if (response.length > 0) {
                        const resp = generateResponse(true, 'Suggestion Prompt fetched successfully', selected);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch Indexes');
                    }

                } catch (error) {
                    this.logger.info(`Stocks > Get Indexes : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        getStockOverview: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getStockOverview"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > getStockOverview : Service Starting `);

                    const validation = cocodeValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getStockOverview : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const [companyDescriptionResponse] = await rawQuery(this.db['sequelize'],`select ch."LNAME", ch."MEMO", cm.nsesymbol from company_history ch join company_master cm on cm.co_code = ch.cocode where ch."isActive" = true and ch.cocode = ${cocode} limit 1`);

                    const [fundamentalsResponse] = await rawQuery(this.db['sequelize'], `SELECT 
                            yr."PE" AS "PE", 
                            yr."PBV" AS "PBV", 
                            yr."DIVYIELD" AS "DIVYIELD", 
                            yr."ROE" AS "ROE",
                            dr."Industry_PE" AS "Industry_PE"
                        FROM yearly_ratios yr
                        JOIN daily_ratios dr ON yr.co_code = dr.co_code AND yr."type"::text = dr."type"::text
                        WHERE yr.co_code = ${cocode} AND yr."type" = 'S' ORDER BY yr."YRC" DESC
                        LIMIT 1`);

                    const resp = generateResponse(true, 'Stock Overview', {
                        companyDetail : companyDescriptionResponse || {},
                        fundamental : fundamentalsResponse || {}
                    });
                    return resp;
                } catch (error) {
                    this.logger.info(`Stocks > getStockOverview : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },

        getFinancialsPeers : {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getFinancialsPeers"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > getFinancialsPeers : Service Starting `);

                    const validation = cocodeValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getFinancialsPeers : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const peersResponse = await rawQuery(this.db['sequelize'], `WITH sector_companies AS (
                            SELECT
                                companyname, co_code
                            FROM
                                company_master
                            WHERE
                                sectorcode = (SELECT sectorcode FROM company_master WHERE co_code = ${cocode})
                        ),
                        ranked_companies AS (
                            SELECT
                                sc.companyname,
                                yr.co_code,
                                yr."MCAP",
                                yr."PE",
                                yr."DIVYIELD",
                                ROW_NUMBER() OVER (PARTITION BY yr.co_code ORDER BY yr.co_code) AS rn
                            FROM
                                sector_companies sc
                            JOIN
                                daily_ratios yr ON sc.co_code = yr.co_code
                            WHERE
                                sc.co_code <> ${cocode}
                                AND yr.type = 'S'
                        )
                        SELECT
                            companyname,
                            "MCAP",
                            "PE",
                            "DIVYIELD"
                        FROM
                            ranked_companies
                        WHERE
                            rn = 1
                        `);

                    const resp = generateResponse(true, 'Financial Peers', peersResponse);
                    return resp;
                } catch (error) {
                    this.logger.info(`Stocks > getFinancialsPeers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },

        getFinancialsShareHolding : {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getFinancialsShareHolding"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > getFinancialsShareHolding : Service Starting `);

                    const validation = cocodeValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getFinancialsShareHolding : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const [response] = await rawQuery(this.db['sequelize'], `WITH OrderedHoldings AS (
                SELECT 
                    "YRC" AS "year",
                    "TotalPromoter_PerShares" AS "Promoter",
                    "TotalPromoter_PerPledgeShares" AS "Pledge",
                    "FIIs_Holding" AS "FII",
                    "DIIs_Holding" AS "DII",
                    "Public_Holding" AS "Retail",
                    ROW_NUMBER() OVER (ORDER BY "YRC" DESC) AS rn
                FROM public."shareHoldingPattern"
                WHERE co_code = ${cocode}
            ),
            LatestAndPrevious AS (
                SELECT
                    MAX(CASE WHEN rn = 1 THEN "Promoter" END) AS "Latest_Quarter_Promoter",
                    MAX(CASE WHEN rn = 1 THEN "year" END) AS "Latest_Quarter_Year",
                    MAX(CASE WHEN rn = 2 THEN "Promoter" END) AS "Previous_Quarter_Promoter",
                    MAX(CASE WHEN rn = 2 THEN "year" END) AS "Previous_Quarter_Year",
                    MAX(CASE WHEN rn = 4 THEN "Promoter" END) AS "Prev_Year_Promoter",
                    MAX(CASE WHEN rn = 4 THEN "year" END) AS "Prev_Year",
                    
                    MAX(CASE WHEN rn = 1 THEN "Pledge" END) AS "Latest_Quarter_Pledge",
                    MAX(CASE WHEN rn = 2 THEN "Pledge" END) AS "Previous_Quarter_Pledge",
                    MAX(CASE WHEN rn = 1 THEN "FII" END) AS "Latest_Quarter_FII",
                    MAX(CASE WHEN rn = 2 THEN "FII" END) AS "Previous_Quarter_FII",
                    MAX(CASE WHEN rn = 1 THEN "DII" END) AS "Latest_Quarter_DII",
                    MAX(CASE WHEN rn = 2 THEN "DII" END) AS "Previous_Quarter_DII",
                    MAX(CASE WHEN rn = 1 THEN "Retail" END) AS "Latest_Quarter_Retail",
                    MAX(CASE WHEN rn = 2 THEN "Retail" END) AS "Previous_Quarter_Retail",
                    
                    MAX(CASE WHEN rn = 4 THEN "Pledge" END) AS "Prev_Year_Pledge",
                    MAX(CASE WHEN rn = 4 THEN "FII" END) AS "Prev_Year_FII",
                    MAX(CASE WHEN rn = 4 THEN "DII" END) AS "Prev_Year_DII",
                    MAX(CASE WHEN rn = 4 THEN "Retail" END) AS "Prev_Year_Retail"
                FROM OrderedHoldings
            )
            SELECT json_agg(data) AS data
            FROM (
                SELECT json_build_object(
                    'Previous_Quarter_Year', COALESCE(CAST("Previous_Quarter_Year" AS TEXT), NULL), 
                    'Previous_Quarter_Value', CAST("Previous_Quarter_Promoter" AS TEXT),
                    'Latest_Quarter_Year', COALESCE(CAST("Latest_Quarter_Year" AS TEXT), NULL), 
                    'Latest_Quarter_Value', CAST("Latest_Quarter_Promoter" AS TEXT),
                    'type', 'promoter',
                    'QoQ_change', 
                        CASE WHEN COALESCE("Previous_Quarter_Promoter", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Promoter", 0) - COALESCE("Previous_Quarter_Promoter", 0)) * 100.0 / COALESCE("Previous_Quarter_Promoter", 1)
                            ELSE NULL END,
                    'YoY_change', 
                        CASE WHEN COALESCE("Prev_Year_Promoter", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Promoter", 0) - COALESCE("Prev_Year_Promoter", 0)) * 100.0 / COALESCE("Prev_Year_Promoter", 1)
                            ELSE NULL END
                    ) AS data FROM LatestAndPrevious
                UNION ALL

                SELECT  json_build_object(
                    'Previous_Quarter_Year', COALESCE(CAST("Previous_Quarter_Year" AS TEXT), NULL), 
                    'Previous_Quarter_Value', CAST("Previous_Quarter_Pledge" AS TEXT),
                    'Latest_Quarter_Year', COALESCE(CAST("Latest_Quarter_Year" AS TEXT), NULL), 
                    'Latest_Quarter_Value', CAST("Latest_Quarter_Pledge" AS TEXT),
                    'type', 'pledge',
                    'QoQ_change', 
                        CASE WHEN COALESCE("Previous_Quarter_Pledge", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Pledge", 0) - COALESCE("Previous_Quarter_Pledge", 0)) * 100.0 / COALESCE("Previous_Quarter_Pledge", 1)
                            ELSE NULL END,
                    'YoY_change', 
                        CASE WHEN COALESCE("Prev_Year_Pledge", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Pledge", 0) - COALESCE("Prev_Year_Pledge", 0)) * 100.0 / COALESCE("Prev_Year_Pledge", 1)
                            ELSE NULL END
                    )AS data FROM LatestAndPrevious
                UNION ALL
                SELECT json_build_object(
                    'Previous_Quarter_Year', COALESCE(CAST("Previous_Quarter_Year" AS TEXT), NULL), 
                    'Previous_Quarter_Value', CAST("Previous_Quarter_FII" AS TEXT),
                    'Latest_Quarter_Year', COALESCE(CAST("Latest_Quarter_Year" AS TEXT), NULL), 
                    'Latest_Quarter_Value', CAST("Latest_Quarter_FII" AS TEXT),
                    'type', 'fii',
                    'QoQ_change', 
                        CASE WHEN COALESCE("Previous_Quarter_FII", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_FII", 0) - COALESCE("Previous_Quarter_FII", 0)) * 100.0 / COALESCE("Previous_Quarter_FII", 1)
                            ELSE NULL END,
                    'YoY_change', 
                        CASE WHEN COALESCE("Prev_Year_FII", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_FII", 0) - COALESCE("Prev_Year_FII", 0)) * 100.0 / COALESCE("Prev_Year_FII", 1)
                            ELSE NULL END
                    )AS data FROM LatestAndPrevious
                UNION ALL

                SELECT json_build_object(
                    'Previous_Quarter_Year', COALESCE(CAST("Previous_Quarter_Year" AS TEXT), NULL), 
                    'Previous_Quarter_Value', CAST("Previous_Quarter_DII" AS TEXT),
                    'Latest_Quarter_Year', COALESCE(CAST("Latest_Quarter_Year" AS TEXT), NULL), 
                    'Latest_Quarter_Value', CAST("Latest_Quarter_DII" AS TEXT),
                    'type', 'dii',
                    'QoQ_change', 
                        CASE WHEN COALESCE("Previous_Quarter_DII", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_DII", 0) - COALESCE("Previous_Quarter_DII", 0)) * 100.0 / COALESCE("Previous_Quarter_DII", 1)
                            ELSE NULL END,
                    'YoY_change', 
                        CASE WHEN COALESCE("Prev_Year_DII", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_DII", 0) - COALESCE("Prev_Year_DII", 0)) * 100.0 / COALESCE("Prev_Year_DII", 1)
                            ELSE NULL END
                    )AS data FROM LatestAndPrevious
                UNION ALL
                SELECT json_build_object(
                    'Previous_Quarter_Year', COALESCE(CAST("Previous_Quarter_Year" AS TEXT), NULL), 
                    'Previous_Quarter_Value', CAST("Previous_Quarter_Retail" AS TEXT),
                    'Latest_Quarter_Year', COALESCE(CAST("Latest_Quarter_Year" AS TEXT), NULL), 
                    'Latest_Quarter_Value', CAST("Latest_Quarter_Retail" AS TEXT),
                    'type', 'retail',
                    'QoQ_change', 
                        CASE WHEN COALESCE("Previous_Quarter_Retail", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Retail", 0) - COALESCE("Previous_Quarter_Retail", 0)) * 100.0 / COALESCE("Previous_Quarter_Retail", 1)
                            ELSE NULL END,
                    'YoY_change', 
                        CASE WHEN COALESCE("Prev_Year_Retail", 0) != 0 
                            THEN (COALESCE("Latest_Quarter_Retail", 0) - COALESCE("Prev_Year_Retail", 0)) * 100.0 / COALESCE("Prev_Year_Retail", 1)
                            ELSE NULL END
                    ) AS data FROM LatestAndPrevious
            ) AS combined_data`);

                    const resp = generateResponse(true, 'Financial Shareholdings', response ? response.data : []);
                    return resp;
                } catch (error) {
                    this.logger.info(`Stocks > getFinancialsShareHolding : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },

        getFinancialsResults : {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getFinancialsResults"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > getFinancialsResults : Service Starting `);

                    const validation = cocodeValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getFinancialsResults : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const [response] = await rawQuery(this.db['sequelize'], `WITH latest_year_data AS (
                        SELECT
                            "NetSales"::NUMERIC AS "NetSales",
                            "Netprofit"::NUMERIC AS "Netprofit",
                            "YRC" AS year
                        FROM public."yearly_ratios"
                        WHERE co_code = ${cocode}
                        AND type = 'S'
                        ORDER BY "YRC" DESC
                        LIMIT 2
                    ),

                    ranked_year_data AS (
                        SELECT *,
                            ROW_NUMBER() OVER (ORDER BY year DESC) AS rn
                        FROM latest_year_data
                    ),

                    calculated_yoy AS (
                        SELECT
                            MAX(CASE WHEN rn = 1 THEN year END) AS latest_year,
                            MAX(CASE WHEN rn = 1 THEN "NetSales" END) AS sale_latest_year_value,
                            MAX(CASE WHEN rn = 2 THEN "NetSales" END) AS sale_previous_year_value,
                            MAX(CASE WHEN rn = 1 THEN "Netprofit" END) AS pro_latest_year_value,
                            MAX(CASE WHEN rn = 2 THEN "Netprofit" END) AS pro_previous_year_value
                        FROM ranked_year_data
                    ),

                    latest_quarter_data AS (
                        SELECT
                            "NetSales"::NUMERIC AS "NetSales",
                            "Netprofit"::NUMERIC AS "Netprofit",
                            "QtrEnd" AS quarter -- Assuming QRC stands for quarter in your table
                        FROM public."quaterly_ratios"
                        WHERE co_code = ${cocode}
                        AND type = 'S'
                        ORDER BY "QtrEnd" DESC
                        LIMIT 2
                    ),

                    ranked_quarter_data AS (
                        SELECT *,
                            ROW_NUMBER() OVER (ORDER BY quarter DESC) AS rn
                        FROM latest_quarter_data
                    ),

                    calculated_qoq AS (
                        SELECT
                            MAX(CASE WHEN rn = 1 THEN quarter END) AS latest_quarter,
                            MAX(CASE WHEN rn = 1 THEN "NetSales" END) AS sale_latest_quarter_value,
                            MAX(CASE WHEN rn = 2 THEN "NetSales" END) AS sale_previous_quarter_value,
                            MAX(CASE WHEN rn = 1 THEN "Netprofit" END) AS pro_latest_quarter_value,
                            MAX(CASE WHEN rn = 2 THEN "Netprofit" END) AS pro_previous_quarter_value
                        FROM ranked_quarter_data
                    )

                    SELECT jsonb_agg(result)
                    FROM (
                        SELECT jsonb_build_object(
                            'yoy', CASE
                                WHEN (SELECT sale_previous_year_value FROM calculated_yoy) IS NULL OR (SELECT sale_previous_year_value::NUMERIC FROM calculated_yoy) = 0 
                                THEN NULL
                                ELSE (
                                    (SELECT sale_latest_year_value FROM calculated_yoy) 
                                    - (SELECT sale_previous_year_value FROM calculated_yoy)
                                ) * 100.0 / (SELECT sale_previous_year_value FROM calculated_yoy)
                            END,
                            'qoq', CASE
                                WHEN (SELECT sale_previous_quarter_value FROM calculated_qoq) IS NULL OR (SELECT sale_previous_quarter_value::NUMERIC FROM calculated_qoq) = 0 
                                THEN NULL
                                ELSE (
                                    (SELECT sale_latest_quarter_value FROM calculated_qoq) 
                                    - (SELECT sale_previous_quarter_value FROM calculated_qoq)
                                ) * 100.0 / (SELECT sale_previous_quarter_value FROM calculated_qoq)
                            END,
                            'type', 'net_sales',
                            'latest_quarter', (SELECT latest_quarter FROM calculated_qoq)::text, 
                            'latest_value', (SELECT sale_latest_quarter_value FROM calculated_qoq)
                        ) AS result

                        UNION ALL

                        SELECT jsonb_build_object(
                            'yoy', CASE
                                WHEN (SELECT pro_previous_year_value FROM calculated_yoy) IS NULL OR (SELECT pro_previous_year_value::NUMERIC FROM calculated_yoy) = 0 
                                THEN NULL
                                ELSE (
                                    (SELECT pro_latest_year_value FROM calculated_yoy) 
                                    - (SELECT pro_previous_year_value FROM calculated_yoy)
                                ) * 100.0 / (SELECT pro_previous_year_value FROM calculated_yoy)
                            END,
                            'qoq', CASE
                                WHEN (SELECT pro_previous_quarter_value FROM calculated_qoq) IS NULL OR (SELECT pro_previous_quarter_value::NUMERIC FROM calculated_qoq) = 0 
                                THEN NULL
                                ELSE (
                                    (SELECT pro_latest_quarter_value FROM calculated_qoq) 
                                    - (SELECT pro_previous_quarter_value FROM calculated_qoq)
                                ) * 100.0 / (SELECT pro_previous_quarter_value FROM calculated_qoq)
                            END,
                            'type', 'net_profit',
                            'latest_quarter', (SELECT latest_quarter FROM calculated_qoq)::text, 
                            'latest_value', (SELECT pro_latest_quarter_value FROM calculated_qoq)
                        ) AS result
                    ) AS combined_results`);

                    const resp = generateResponse(true, 'Financial Results', response?.jsonb_agg);
                    return resp;
                } catch (error) {
                    this.logger.info(`Stocks > getFinancialsResults : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },

        getStockRevenue : {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getStockRevenue"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Stocks > getStockRevenue : Service Starting `);

                    const validation = cocodeValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Stock > getStockRevenue : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { cocode } = ctx.params.query;

                    const [revenueResponse] = await rawQuery(this.db['sequelize'], `SELECT json_build_object(
                                '2024', "Y202403",
                                '2023', "Y202303",
                                '2022', "Y202203",
                                '2021', "Y202103",
                                '2020', "Y202003"
                            ) AS result
                            FROM "pnLStatement"
                            WHERE "cocode" = ${cocode}
                            AND "COLUMNNAME" = 'Total Revenue'
                            AND type = 'C'`);

                    const resp = generateResponse(true, 'Stock Revenue', ((revenueResponse)?revenueResponse.result:{}) || {});
                    return resp;
                } catch (error) {
                    this.logger.info(`Stocks > getStockRevenue : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
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

require('dotenv').config();

async function convertStockResponse(param, logger) {
    try {
        logger.info(`stock > detail key mapping  : Started`);
        if (param) {
            const originalData = param;
            // Create a new object with custom keys
            // let customData = { ...param };
            const customData = {
                "ticker": originalData.ticker,
                // Map other keys as needed
            };
            // You can also map nested objects or arrays
            customData.results = await originalData.results.map(result => ({
                "tradingVolume ": result.v, //result.v.toString(), // Store as a string if want same result as coming from third party response
                "averagePrice ": result.vw,
                "openPrice": result.o,
                "closePrice": result.c,
                "highestPrice": result.h,
                "lowestPrice": result.l,
                "timestamp": result.t,
                "numberOfTransactions": result.n,
            }));
            logger.info(`stock > detail custom key mapping done : ${customData}`);
            return customData;

        } else {
            return {};
        }
    } catch (err) {
        logger.info(`stock > detail key mapping : Internal Error : ${JSON.stringify(err)}`);
        throw err;
    }
}

async function fetchStockDetails(param, logger) {
    return new Promise(async (resolve, reject) => {
        try {
            logger.info(`Stock details > thisr party url call  : Service Starting `);

            let URL = `${process.env.POLYGON_BASE_URL}/aggs/ticker/${param.stocksTicker}/range/${param.multiplier}/${param.timespan}/${param.from}/${param.to}?apiKey=${param.apiKey}`

            if (param.adjusted) {
                URL += `&adjusted=${param.adjusted}`
            }
            if (param.sort) {
                URL += `&sort=${param.sort}`
            }
            if (param.limit) {
                URL += `&limit=${param.limit}`
            }

            const response = await fetch(URL);
            const data = await response.json();
            const apiResponse = await convertStockResponse(data, logger);
            logger.info(`Data Fetched Successfully from ${URL}`);

            if (apiResponse) {
                resolve(apiResponse);
            } else {
                reject({});
            }
        } catch (err) {
            reject(err);
        }

    });
}

async function fetchReferenceNews(param, logger) {
    return new Promise(async (resolve, reject) => {
        try {
            logger.info(`News > third party url call  : Service Starting `);

            let URL = `${process.env.POLYGON_BASE_URL}/reference/news?apiKey=${process.env.POLYGON_API_KEY}`

            if (param.limit) {
                URL += `&limit=${param.limit}`
            }
            if (param.ticker) {
                URL += `&ticker=${param.ticker}`
            }
            const temp = []
            const response = await fetch(URL);
            const data = await response.json();

            if(typeof data['error'] === 'undefined'){
                const newsData = data.results.map(el => {
                    let obj = {
                        title: el.title,
                        description: el.description,
                        publisher: el.publisher,
                        image: el.banner_image,
                        article_url: el.article_url,
                        image_url: el.image_url,
                        timeStamp: el.published_utc,
                    }
                    temp.push(obj)
                })
                logger.info(`Data Fetched Successfully`);
    
                if (temp.length > 0) {
                    resolve(temp);
                } else {
                    reject({});
                }
            }else{
                reject('Error in fetching Reference News');
            }

            
        } catch (err) {
            reject(err);
        }

    });
}


module.exports = Object.assign({}, {
    fetchStockDetails,
    fetchReferenceNews,
})
async function getQuote(ticker, logger) {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.ALPHAVANTAGE_URL}/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHAVANTAGE_KEY}`
            logger.info(`Url for Quote ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            logger.info(`Data Fetched from ${url} : ${JSON.stringify(data)}`);
            if (data && (typeof data['Information'] === 'undefined') && (typeof data['Error Message'] === 'undefined')) {
                resolve(data);
            } else {
                reject('Issue in fetching data from ALPHAVANTAGE_URL');
            }
        } catch (err) {
            reject(err);
        }

    });
}

async function searchStock(keyword, logger) {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.ALPHAVANTAGE_URL}/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${process.env.FMP_KEY}`;
            logger.info(`Url for searchStock ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            logger.info(`Data Fetched from ${url} : ${JSON.stringify(response)}`);
            if (data) {
                resolve(data);
            } else {
                reject({});
            }
        } catch (err) {
            reject(err);
        }

    });
}

async function getStatictics(ticker, logger){
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.ALPHAVANTAGE_URL}/query?function=OVERVIEW&symbol=${ticker}&apikey=${process.env.ALPHAVANTAGE_KEY}`;
            logger.info(`Url for getStatictics ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            logger.info(`Data Fetched from ${url} : ${JSON.stringify(response)}`);
            if (data && (typeof data['Information'] === 'undefined') && (typeof data['Error Message'] === 'undefined')) {
                resolve(data);
            } else {
                reject({});
            }
        } catch (err) {
            reject(err);
        }

    });
}

async function getNews(logger){
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${process.env.ALPHAVANTAGE_KEY}`;
            logger.info(`Url for getNews ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            logger.info(`Data Fetched from ${url} : ${JSON.stringify(data)}`);

            // Check if data.feed exists and is an array
            if (!data || !data.feed || !Array.isArray(data.feed)) {
                logger.warn(`getNews: Invalid data structure - data.feed is missing or not an array: ${JSON.stringify(data)}`);
                resolve([]); // Return empty array instead of rejecting
                return;
            }

            const filteredFeeds = data.feed.filter((feedItem) => {
                // Check if feedItem and topics exist
                if (!feedItem || !feedItem.topics || !Array.isArray(feedItem.topics)) {
                    return false;
                }

                const hasFinancialMarketsTopic = feedItem.topics.some(
                  (topic) => topic && topic.topic === "Financial Markets" && topic.relevance_score > 0.5
                );
                return hasFinancialMarketsTopic;
              });

            logger.info(`getNews: Filtered ${filteredFeeds.length} financial news items from ${data.feed.length} total items`);

            if (data && (typeof data['Information'] === 'undefined') && (typeof data['Error Message'] === 'undefined')) {
                resolve(filteredFeeds);
            } else {
                logger.warn(`getNews: API returned error information: ${JSON.stringify(data)}`);
                resolve([]); // Return empty array instead of rejecting
            }
        } catch (err) {
            reject(err);
        }

    });
}

async function getCompanyDetails(ticker, logger){
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${process.env.ALPHAVANTAGE_KEY}`;
            logger.info(`Url for getCompanyDetails ${url}`);
            const response = await fetch(url);
            const data = await response.json();
            logger.info(`Data Fetched from ${url} : ${JSON.stringify(response)}`);
            if (data && (typeof data['Information'] === 'undefined') && (typeof data['Error Message'] === 'undefined')) {
                resolve({description : data.Description});
            } else {
                reject('Error in fetching company details');
            }
        } catch (err) {
            reject(err);
        }

    });
}


module.exports = Object.assign({}, {
    getQuote,
    searchStock,
    getStatictics,
    getNews,
    getCompanyDetails
});
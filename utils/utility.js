require('dotenv').config();
const jwt = require("jsonwebtoken");
const moment = require("moment");
const axios = require('axios');

// Dummy database to store invalidated tokens
const userTokens = {};

const EmailConfig = {
    host: process.env.senderEmailHost,
    port: process.env.senderEmailPort,
    secure: true,
    auth: {
        user: process.env.senderEmail,
        pass: process.env.senderEmailPass
    }
}

const generateResponse = async (statusCode, message, data = null, withToken, token) => {
    const responseObject = {
        status: statusCode,
        message
    }

    if (data != null) {
        responseObject.data = data;
        if (withToken) {
            responseObject.data.token = token || await generateJWT(data);
        }
    }



    return responseObject;
}

const generateOtp = (length = 4) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }
    return otp;
}

const invalidateToken = (userId) => {
    // Invalidate old tokens for the user
    if (userTokens[userId] && userTokens[userId].length > 0) {
        userTokens[userId] = [];
    }
}

const generateJWT = async(user) => {
    // Invalidate previous token if exists
    await invalidateToken(user.user_id);

    // Generate new token
    const token = jwt.sign({
        user_id: user.user_id,
        user_detail_id: user.user_detail_id,
        cognitoId: user.cognitoId,
        expiresIn: process.env.JWT_EXPIRY || "900s" // 15 minutes in seconds
    }, process.env.JWT_SECRET);

    // Store the token for the user
    if (!userTokens[user.user_id]) {
        userTokens[user.user_id] = [];
    }
    userTokens[user.user_id].push(token);

    return token;
}

const getStartEndDate = (withDate) => {
    const currentMonth = moment().month(); // Month (0-11, where 0 is January)
    const currentYear = moment().year();
    const currentDay = moment().date();
    const createdAtDay = moment(withDate).date();

    const startDate = moment({
        year: currentYear,
        month: createdAtDay > currentDay ? currentMonth - 1 : currentMonth,
        date: createdAtDay + 1
    }).utc().format('YYYY-MM-DD');

    const endDate = moment({
        year: currentYear,
        month: currentDay >= createdAtDay ? currentMonth + 1 : currentMonth,
        date: createdAtDay
    }).utc().format('YYYY-MM-DD');

    return {startDate, endDate}
}
const generateTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
};

const checkEmailGenuineness = async (email) => {
    try {
        const response = await axios.get(`https://disposable.debounce.io/?email=${encodeURIComponent(email)}`);
        const data = response.data;

        // Return true if email is genuine (not disposable)
        return data.disposable === "false";
    } catch (error) {
        console.error('Error checking email genuineness:', error);
        // If API fails, allow registration to continue (fail-open approach)
        return true;
    }
};

module.exports = Object.assign({}, {
    EmailConfig,
    generateResponse,
    generateOtp,
    generateJWT,
    getStartEndDate,
    userTokens,
    generateTimestamp,
    checkEmailGenuineness
})
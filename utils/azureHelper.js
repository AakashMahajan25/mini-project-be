// Azure Helper - Email-only authentication with nodemailer
require('dotenv').config();
const axios = require('axios');

const uploadedBlob = (connectionString, containerName, blobData, path) => {
    return new Promise(async (resolve, reject) => {
        let error = null;
        
        try {
            // Azure blob upload functionality (keeping if needed for file uploads)
            // This part can be implemented if you need file upload to Azure
            console.log('Azure blob upload not implemented - file upload disabled');
            resolve(null);
        } catch (err) {
            error = err.message;
            reject(err);
        }
    });
}

const generateSasToken = () => {
    return new Promise((resolve, reject) => {
        try {
            // Azure SAS token generation (keeping if needed for file access)
            // This part can be implemented if you need Azure file access
            console.log('Azure SAS token generation not implemented');
            resolve(null);
        } catch (err) {
            reject(err);
        }
    });
}

// SMS OTP function (keeping if you decide to add SMS later)
const sendMobileOTP = async (mobile, otp) => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios({
                method: 'get',
                url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${mobile}/${otp}/Sign up OTP`,
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
            });
            resolve(res.data);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    uploadedBlob,
    generateSasToken,
    sendMobileOTP
}
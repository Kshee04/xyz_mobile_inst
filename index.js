const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

require('dotenv').config();

const MPESA_CONFIG = {
    businessShortCode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    callbackURL: 'https://your-ngrok-url.ngrok-free.dev/callback',
    accountReference: 'XYZMobile',
    transactionDesc: 'Application Fee'
};

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Parse error' });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

app.get('/test', (req, res) => {
    res.json({ message: 'Server Running', status: 'ok' });
});

app.post('/api/stkpush', async (req, res) => {
    console.log('STK Push request received');
    try {
        const { phone, amount, enrollmentData } = req.body;
        
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        }
        
        const auth = Buffer.from(MPESA_CONFIG.consumerKey + ':' + MPESA_CONFIG.consumerSecret).toString('base64');
        
        const tokenOptions = {
            hostname: 'sandbox.safaricom.co.ke',
            path: '/oauth/v1/generate?grant_type=client_credentials',
            method: 'GET',
            headers: { 'Authorization': 'Basic ' + auth }
        };
        
        const tokenData = await makeRequest(tokenOptions);
        
        if (!tokenData.access_token) {
            return res.json({ success: false, message: 'Auth failed' });
        }
        
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        
        const password = Buffer.from(MPESA_CONFIG.businessShortCode + MPESA_CONFIG.passkey + timestamp).toString('base64');
        const transactionId = 'XYZ' + Date.now();
        
        const stkBody = {
            BusinessShortCode: MPESA_CONFIG.businessShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: MPESA_CONFIG.businessShortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: MPESA_CONFIG.callbackURL,
            AccountReference: MPESA_CONFIG.accountReference,
            TransactionDesc: MPESA_CONFIG.transactionDesc
        };
        
        const stkOptions = {
            hostname: 'sandbox.safaricom.co.ke',
            path: '/mpesa/stkpush/v1/processrequest',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + tokenData.access_token,
                'Content-Type': 'application/json'
            }
        };
        
        const stkResult = await makeRequest(stkOptions, stkBody);
        console.log('Result:', stkResult);
        
        if (stkResult.ResponseCode === '0') {
            res.json({ success: true, checkoutRequestID: stkResult.CheckoutRequestID, transactionId: transactionId });
        } else {
            res.json({ success: false, message: stkResult.ResponseDescription });
        }
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
    console.log('Test: http://localhost:5000/test');
});
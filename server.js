const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const MPESA_CONFIG = {
    businessShortCode: '174379',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    consumerKey: 'sLBKnjg2bOqLue1g47gKPNGDAmpWn95SZWZGjd9rukT7OFvV',
    consumerSecret: 'eoTttJGo3O5ekAGdVlI7N9zVuCwGPwGkvezu1MXGo9ezmhiLaszUM69bD6dQ8w3D',
    callbackURL: 'https://isaac-mastlike-fretfully.ngrok-free.dev/callback',
    accountReference: 'XYZMobile',
    transactionDesc: 'Application Fee'
};

const https = require('https');

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
    res.json({ message: 'M-Pesa Server Running!', status: 'active', time: new Date().toISOString() });
});

app.post('/api/stkpush', async (req, res) => {
    console.log('STK Push request received');
    console.log('Phone:', req.body.phone);
    console.log('Amount:', req.body.amount);
    
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
            return res.json({ success: false, message: 'Failed to authenticate' });
        }
        
        console.log('Access token obtained');
        
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
            TransactionDesc: MPESA_CONFIG.transactionDesc + ' - ' + (enrollmentData?.firstName || 'Student')
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
        console.log('STK Result:', stkResult);
        
        if (stkResult.ResponseCode === '0') {
            res.json({
                success: true,
                checkoutRequestID: stkResult.CheckoutRequestID,
                transactionId: transactionId,
                message: 'Payment request sent'
            });
        } else {
            res.json({
                success: false,
                message: stkResult.ResponseDescription || 'Payment initiation failed'
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        res.json({ success: false, message: error.message });
    }
});

app.post('/callback', (req, res) => {
    console.log('Callback received');
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Test: http://localhost:' + PORT + '/test');
});
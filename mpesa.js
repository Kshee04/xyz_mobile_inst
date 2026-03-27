// mpesa.js - M-Pesa STK Push Integration
// Lipa Na M-Pesa Sandbox

const MPESA_CONFIG = {
    // Sandbox credentials - DO NOT CHANGE THESE
    businessShortCode: '174379',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    
    // YOUR credentials from Safaricom Developer Portal
    consumerKey: 'sLBKnjg2bOqLue1g47gKPNGDAmpWn95SZWZGjd9rukT7OFvV',  
    consumerSecret: 'eoTttJGo3O5ekAGdVlI7N9zVuCwGPwGkvezu1MXGo9ezmhiLaszUM69bD6dQ8w3D', 
    
    // Your callback URL - must be HTTPS for production, but ngrok works for testing
    callbackURL: 'https://your-domain.com/mpesa-callback.php',  // Update this
    
    // Transaction details
    accountReference: 'XYZMobile',
    transactionDesc: 'Application Fee'
};

const APPLICATION_FEE = 1500;

// Get M-Pesa Access Token
async function getAccessToken() {
    const auth = btoa(MPESA_CONFIG.consumerKey + ':' + MPESA_CONFIG.consumerSecret);
    
    try {
        const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            return data.access_token;
        } else {
            console.error('Failed to get token:', data);
            throw new Error('Failed to authenticate with M-Pesa');
        }
    } catch (error) {
        console.error('Token error:', error);
        throw error;
    }
}

// Format phone number for M-Pesa
function formatPhoneNumber(phone) {
    let formatted = phone.toString().replace(/\D/g, '');
    
    if (formatted.startsWith('0')) {
        formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('254')) {
        formatted = formatted;
    } else if (formatted.startsWith('+254')) {
        formatted = formatted.substring(1);
    } else if (formatted.length === 9) {
        formatted = '254' + formatted;
    }
    
    return formatted;
}

// Generate timestamp for M-Pesa request
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password for STK Push
function generatePassword(timestamp) {
    const str = MPESA_CONFIG.businessShortCode + MPESA_CONFIG.passkey + timestamp;
    return btoa(str);
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, enrollmentData) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const transactionId = `XYZ${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const requestBody = {
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
        TransactionDesc: `${MPESA_CONFIG.transactionDesc} - ${enrollmentData.firstName} ${enrollmentData.lastName}`
    };
    
    // Save pending transaction to Firebase
    await savePendingTransaction(transactionId, amount, formattedPhone, enrollmentData);
    
    try {
        const accessToken = await getAccessToken();
        
        const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.ResponseCode === '0') {
            // Save checkout request ID for tracking
            await updateTransactionWithCheckoutID(transactionId, result.CheckoutRequestID);
            
            return {
                success: true,
                message: 'Payment request sent! Check your phone to complete payment.',
                checkoutRequestID: result.CheckoutRequestID,
                transactionId: transactionId
            };
        } else {
            return {
                success: false,
                message: result.ResponseDescription || 'Payment initiation failed. Please try again.',
                error: result
            };
        }
    } catch (error) {
        console.error('STK Push error:', error);
        return {
            success: false,
            message: 'Network error. Please try again.',
            error: error.message
        };
    }
}

// Save pending transaction
async function savePendingTransaction(transactionId, amount, phone, enrollmentData) {
    const db = firebase.firestore();
    await db.collection('transactions').doc(transactionId).set({
        transactionId: transactionId,
        amount: amount,
        phone: phone,
        enrollmentData: enrollmentData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Update transaction with checkout ID
async function updateTransactionWithCheckoutID(transactionId, checkoutRequestID) {
    const db = firebase.firestore();
    await db.collection('transactions').doc(transactionId).update({
        checkoutRequestID: checkoutRequestID
    });
}

// Update transaction status (called from callback)
async function updateTransactionStatus(checkoutRequestID, status, mpesaReceiptNumber = null) {
    const db = firebase.firestore();
    
    const querySnapshot = await db.collection('transactions')
        .where('checkoutRequestID', '==', checkoutRequestID)
        .get();
    
    if (!querySnapshot.empty) {
        const transactionDoc = querySnapshot.docs[0];
        const transactionData = transactionDoc.data();
        
        await transactionDoc.ref.update({
            status: status,
            mpesaReceiptNumber: mpesaReceiptNumber,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // If payment was successful, save enrollment
        if (status === 'completed' && mpesaReceiptNumber) {
            const enrollmentData = transactionData.enrollmentData;
            const enrollmentNumber = await saveEnrollmentWithPayment(enrollmentData, mpesaReceiptNumber, transactionDoc.id);
            return { enrollmentNumber, transactionData };
        }
        
        return transactionData;
    }
    return null;
}

// Save enrollment after successful payment
async function saveEnrollmentWithPayment(enrollmentData, mpesaReceiptNumber, transactionId) {
    const db = firebase.firestore();
    
    // Generate enrollment number
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const enrollmentNumber = `XYZ-${year}-${random}`;
    
    await db.collection('enrollments').add({
        ...enrollmentData,
        enrollmentNumber: enrollmentNumber,
        paymentStatus: 'paid',
        paymentAmount: APPLICATION_FEE,
        paymentReceipt: mpesaReceiptNumber,
        paymentTransactionId: transactionId,
        paymentDate: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return enrollmentNumber;
}
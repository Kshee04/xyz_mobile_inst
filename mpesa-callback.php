<?php
// mpesa-callback.php - Receive M-Pesa payment confirmation

// Log the callback for debugging
$callbackData = json_decode(file_get_contents('php://input'), true);
file_put_contents('mpesa-callback.log', date('Y-m-d H:i:s') . ' - ' . json_encode($callbackData) . "\n", FILE_APPEND);

// Check if payment was successful
$resultCode = $callbackData['Body']['stkCallback']['ResultCode'];

if ($resultCode == 0) {
    // Payment successful
    $checkoutRequestID = $callbackData['Body']['stkCallback']['CheckoutRequestID'];
    $mpesaReceiptNumber = $callbackData['Body']['stkCallback']['CallbackMetadata']['Item'][1]['Value'];
    $amount = $callbackData['Body']['stkCallback']['CallbackMetadata']['Item'][0]['Value'];
    
    // Here you need to update Firebase
    // You'll need to use Firebase Admin SDK or make an API call
    
    echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Success']);
} else {
    // Payment failed
    $checkoutRequestID = $callbackData['Body']['stkCallback']['CheckoutRequestID'];
    $resultDesc = $callbackData['Body']['stkCallback']['ResultDesc'];
    
    echo json_encode(['ResultCode' => $resultCode, 'ResultDesc' => $resultDesc]);
}
?>
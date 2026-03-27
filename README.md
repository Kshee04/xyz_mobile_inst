
### Step 2: Set Up Firebase
Create a project at the Firebase Console

Enable Firestore Database in test mode

Register a web app and copy your Firebase configuration

Replace the firebaseConfig in firebase-config.js with your credentials

### Step 3: Set Up M-Pesa Backend
npm install express cors
node index.js

### Step 4: Configure Environment Variables
Update index.js with your M-Pesa credentials:
const MPESA_CONFIG = {
    businessShortCode: '174379',
    passkey: 'your_passkey_here',
    consumerKey: 'your_consumer_key',
    consumerSecret: 'your_consumer_secret',
    callbackURL: 'https://your-ngrok-url.ngrok-free.dev/callback',
    accountReference: 'XYZMobile',
    transactionDesc: 'Application Fee'
};

### Step 5: Run Local Development
# Terminal 1: Start Node.js server
node index.js

# Terminal 2: Start ngrok tunnel
ngrok http 5000

# Open browser at your ngrok URL
https://your-ngrok-url.ngrok-free.dev

M-Pesa Integration
How It Works
Student completes the enrollment form with their M-Pesa number

Clicking the Pay button sends a request to the Node.js server

The server initiates an STK Push to the student's phone

Student receives the prompt and enters their PIN

M-Pesa confirms the payment to the callback URL

The server updates Firebase with payment status and enrollment details

Student receives confirmation with an enrollment number

Sandbox Testing
Test phone number: 254708374149

Test PIN: 12345

No actual money is deducted in sandbox mode

The test number always returns success

Production Deployment
To switch to live payments:

Apply for production credentials at the Safaricom Developer Portal

Update API URLs from sandbox.safaricom.co.ke to api.safaricom.co.ke

Use your live business shortcode and credentials

Ensure the callback URL uses HTTPS (Firebase Hosting provides this)

Firebase Collections
enrollments Collection
Stores all student enrollment records after successful payment.

{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "254712345678",
  mpesaPhone: "254712345678",
  program: "Full Stack Software Engineering",
  learningMode: "Full-time Remote",
  education: "Bachelor's Degree",
  source: "Social Media",
  comments: "",
  newsletter: true,
  enrollmentNumber: "XYZ-2026-1234",
  paymentStatus: "paid",
  paymentAmount: 1500,
  paymentReceipt: "MPESA-123456789",
  paymentTransactionId: "XYZ1734567890123",
  paymentDate: timestamp,
  status: "active",
  createdAt: timestamp
}

transactions Collection
Tracks all M-Pesa payment attempts.
{
  transactionId: "XYZ1734567890123",
  amount: 1500,
  phone: "254712345678",
  checkoutRequestID: "ws_CO_123456789",
  status: "completed",
  mpesaReceiptNumber: "MPESA-123456789",
  enrollmentData: { ... },
  createdAt: timestamp,
  completedAt: timestamp
}

contacts Collection
Stores contact form submissions and newsletter signups.
{
  name: "John Doe",
  email: "john@example.com",
  phone: "0712345678",
  message: "I'm interested in software engineering",
  interest: "Software Engineering",
  newsletter: true,
  timestamp: timestamp,
  status: "new"
}

Available Courses
Course	Duration	Delivery Modes
Full Stack Software Engineering	24 weeks	Hybrid, Remote, Part-time
Data Science Bootcamp	24 weeks	Hybrid, Remote, Part-time
Cyber Security Bootcamp	20 weeks	Hybrid, Remote
AI & Machine Learning	24 weeks	Hybrid, Remote
Android Development	20 weeks	Remote, Part-time
iOS Development	20 weeks	Remote, Hybrid
DevOps Engineering	16 weeks	Remote, Part-time
Deployment
Deploy to Firebase Hosting

npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy

Your site will be available at: https://your-project-id.web.app (yours)

Git Commands for Updates
git add .
git commit -m "Description of changes"
git push origin main

Student Outcomes Statistics
94% employment rate within 6 months of graduation

800+ employer partners across Africa and globally

12,000+ graduates trained since 2016

95% graduate satisfaction rating

Hiring Partners
Safaricom

MTN

Orange

Vodacom

Airtel

IBM

Microsoft

Andela

Contact
XYZ Mobile Institution

Email: info@xyzmobile.com

Phone: +254 700 0** 000

Address: Ngong Road, Nairobi, Kenya

Website: https://isaac-mastlike-fretfully.ngrok-free.dev/index.html

License
MIT License

Copyright (c) 2026 XYZ Mobile Institution

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Acknowledgments
Safaricom for providing the M-Pesa API documentation and sandbox environment

Firebase for hosting and database services

All contributors and students who provided feedback during development


Note: This is just a demo school. The ngrok URL shown is temporary and will expire. For a permanent live site, deploy to Firebase Hosting.

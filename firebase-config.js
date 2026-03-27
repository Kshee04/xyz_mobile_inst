// firebase-config.js
// Initialize Firebase for XYZ Mobile Institution

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2Ee8L_7cMX6vHw-BGJOW-y3Ut1EbDaDo",
  authDomain: "xyz-mobile-institution-b2591.firebaseapp.com",
  projectId: "xyz-mobile-institution-b2591",
  storageBucket: "xyz-mobile-institution-b2591.firebasestorage.app",
  messagingSenderId: "634389271239",
  appId: "1:634389271239:web:612670fd0cd80a53ad24e2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore and Auth instances
const db = firebase.firestore();
const auth = firebase.auth();

// Helper functions for your website

// 1. Save contact form submissions
async function saveContact(formData) {
  try {
    await db.collection('contacts').add({
      ...formData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new'
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving contact:', error);
    return { success: false, error: error.message };
  }
}

// 2. Save newsletter subscriptions
async function subscribeNewsletter(email, name = '') {
  try {
    await db.collection('newsletter').add({
      email,
      name,
      subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 3. Save course inquiries
async function saveInquiry(course, userData) {
  try {
    await db.collection('inquiries').add({
      course,
      ...userData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 4. User signup
async function signUp(email, password, userData) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    await db.collection('users').doc(user.uid).set({
      ...userData,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      role: 'student'
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 5. User login
async function signIn(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 6. Sign out
function signOut() {
  return auth.signOut();
}
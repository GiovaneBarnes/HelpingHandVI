const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'helpinghandvi'
});

async function deleteUser(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    console.log(`Successfully deleted Firebase Auth user for ${email}`);
  } catch (error) {
    console.error(`Error deleting user: ${error.message}`);
  }
}

// Delete the specific user
deleteUser('giovanebarnes@outlook.com');
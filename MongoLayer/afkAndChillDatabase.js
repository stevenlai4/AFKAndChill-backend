const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function () {
    // MongoDB Atalas connection string
    const MONGODB_URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.fmkwb.mongodb.net/AfkAndChillDatabase?retryWrites=true&w=majority`;

    // Connect to our MongoDB database hosted on MongoDB Atlas
    const client = await MongoClient(MONGODB_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).connect();

    // Create the database and tables
    const db = client.db('AfkAndChillDatabase');
    const users = db.collection('users');
    const chatboxes = db.collection('chatboxes');
    const messages = db.collection('messages');

    // Create user function
    async function createUser({
        userId,
        userName,
        photoUrl,
        about,
        gender,
        genderPref,
        games,
    }) {
        try {
            // Check if the user already exists
            const existedUser = await users.findOne({ cognito_id: userId });
            if (existedUser) {
                throw 'User already exists';
            }

            // Insert a new user to the user table
            await users.insertOne({
                cognito_id: userId,
                name: userName,
                photo_url: photoUrl,
                about,
                gender,
                gender_pref: genderPref,
                games,
                likes: [],
                dislikes: [],
            });

            return;
        } catch (error) {
            throw error;
        }
    }

    return {
        createUser,
    };
};

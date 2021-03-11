const { MongoClient } = require('mongodb');

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

    // Update like function
    async function updateLike({ userOneId, userTwoId }) {
        try {
            // Check if both users exist
            const firstExistedUser = await users.findOne({
                cognito_id: userOneId,
            });
            const secondExistedUser = await users.findOne({
                cognito_id: userTwoId,
            });
            if (!firstExistedUser || !secondExistedUser) {
                throw 'User/Users does not exist';
            }

            // Check if user one already liked/disliked user two
            // Check liked
            const isLiked = await users.findOne({
                cognito_id: userOneId,
                likes: { $in: [userTwoId] },
            });
            if (isLiked) {
                throw 'User is already being liked';
            }
            // Check disliked
            const isDisliked = await users.findOne({
                cognito_id: userOneId,
                dislikes: { $in: [userTwoId] },
            });
            if (isDisliked) {
                throw 'User is already being disliked';
            }

            // Insert second user id into first user likes array
            await users.findOneAndUpdate(
                { cognito_id: userOneId },
                { $push: { likes: userTwoId } }
            );

            // Check if both users like each other
            // If YES then create a chatbox for them
            const isLikedBySecondUser = await users.findOne({
                cognito_id: userTwoId,
                likes: { $in: [userOneId] },
            });
            if (isLikedBySecondUser) {
                await chatboxes.insertOne({
                    user_one: userOneId,
                    user_two: userTwoId,
                });
            }

            return;
        } catch (error) {
            throw error;
        }
    }

    // Update dislike function
    async function updateDislike({ userOneId, userTwoId }) {
        try {
            // Check if both users exist
            const firstExistedUser = await users.findOne({
                cognito_id: userOneId,
            });
            const secondExistedUser = await users.findOne({
                cognito_id: userTwoId,
            });
            if (!firstExistedUser || !secondExistedUser) {
                throw 'User/Users does not exist';
            }

            // Check if user one already liked/disliked user two
            // Check liked
            const isLiked = await users.findOne({
                cognito_id: userOneId,
                likes: { $in: [userTwoId] },
            });
            if (isLiked) {
                throw 'User is already being liked';
            }
            // Check disliked
            const isDisliked = await users.findOne({
                cognito_id: userOneId,
                dislikes: { $in: [userTwoId] },
            });
            if (isDisliked) {
                throw 'User is already being disliked';
            }

            // Insert second user id into first user likes array
            await users.findOneAndUpdate(
                { cognito_id: userOneId },
                { $push: { dislikes: userTwoId } }
            );

            return;
        } catch (error) {
            throw error;
        }
    }

    return {
        createUser,
        updateLike,
        updateDislike,
    };
};

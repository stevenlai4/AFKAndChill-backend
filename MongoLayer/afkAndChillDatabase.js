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
        name,
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
                name,
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

    // Update user function
    async function updateUser({
        userId,
        userName,
        photoUrl,
        about,
        gender,
        genderPref,
        games,
    }) {
        try {
            // Check if the user exists
            const existedUser = await users.findOne({ cognito_id: userId });
            if (!existedUser) {
                throw 'User does not exist';
            }

            // Update object
            const update = {
                name: userName,
                photo_url: photoUrl,
                about,
                gender,
                gender_pref: genderPref,
                games,
            };

            // Update the user info
            await users.findOneAndUpdate(
                { cognito_id: userId },
                { $set: update }
            );

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

    // Create a new message function
    async function createMessage({ userId, chatboxId, message }) {
        try {
            // Check if the user exists
            const existedUser = await users.findOne({ cognito_id: userId });
            if (!existedUser) {
                throw 'User does not exist';
            }

            // Check if the chatbox exists
            const existedChatBox = await chatboxes.findOne({
                _id: ObjectId(chatboxId),
            });
            if (!existedChatBox) {
                throw 'Chatbox does not exist';
            }

            // Create a new message
            await messages.insertOne({
                chat_id: existedChatBox._id,
                user_id: userId,
                message,
                timestamp: Date.now(),
            });

            return;
        } catch (error) {
            throw error;
        }
    }

    // Get all messages function
    async function getAllMessages({ chatboxId }) {
        try {
            // Check if chatbox exists
            const existedChatbox = await chatboxes.findOne({
                _id: ObjectId(chatboxId),
            });
            if (!existedChatbox) {
                throw 'Checkbox does not exist';
            }

            // Retrieve message data
            const response = await messages
                .find({
                    $query: { chat_id: ObjectId(existedChatbox._id) },
                    $orderby: { timestamp: -1 },
                })
                .toArray();

            return response;
        } catch (error) {
            throw error;
        }
    }

    // Get all matchable chillers function
    async function getChillers({ userId }) {
        try {
            // Check if the user exists
            const existedUser = await users.findOne({
                cognito_id: userId,
            });
            if (!existedUser) {
                throw 'User does not exist';
            }

            // Find all the chillers that are matchable with the user
            // - Chiller's id should not be the same as the user's id
            // - Chiller's id should not already existed in the user's likes/dislikes arrays
            // - Chiller's gender must match user's gender preference
            // - One of chiller's game must match user's game list item
            const response = await users
                .find({
                    $and: [
                        { cognito_id: { $ne: existedUser.cognito_id } },
                        { cognito_id: { $nin: existedUser.likes } },
                        { cognito_id: { $nin: existedUser.dislikes } },
                        { gender: existedUser.gender_pref },
                        { games: { $elemMatch: { $in: existedUser.games } } },
                    ],
                })
                .toArray();

            return response;
        } catch (error) {
            throw error;
        }
    }

    // Get all chatboxes for the user function
    async function getChatboxes({ userId }) {
        try {
            // Check if the user exists
            const existedUser = await users.findOne({
                cognito_id: userId,
            });
            if (!existedUser) {
                throw 'User does not exist';
            }

            // Fetching all chatboxes for the user
            const response = await chatboxes
                .find({
                    $or: [{ user_one: userId }, { user_two: userId }],
                })
                .toArray();

            return response;
        } catch (error) {
            throw error;
        }
    }

    return {
        createUser,
        updateLike,
        updateDislike,
        createMessage,
        getAllMessages,
        getChillers,
        getChatboxes,
        updateUser,
    };
};

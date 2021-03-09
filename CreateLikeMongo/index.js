const { ObjectId, MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const MONGODB_URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.fmkwb.mongodb.net/AfkAndChillDatabase?retryWrites=true&w=majority`;

let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    // Connect to our MongoDB database hosted on MongoDB Atlas
    const client = await MongoClient(MONGODB_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).connect();
    // Specify which database we want to use
    const db = client.db('AfkAndChillDatabase');
    cachedDb = db;
    return db;
}

// Verify if the token is undefied or not
const vertifyToken = (token) => {
    if (typeof token !== 'undefined') {
        return true;
    }

    return false;
};

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const { token, userTwoId } = event.headers;

    // Verify the jwt token
    if (!vertifyToken(token)) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                errorMsg: 'Token is undefined',
            }),
        };
    }

    try {
        // Connect to the database
        const db = await connectToDatabase();

        return jwt.verify(token, 'secret', async (err, authData) => {
            if (err) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        errorMsg: 'Token not matched',
                    }),
                };
            }

            // Check if both users exist
            const firstExistedUser = await db
                .collection('user')
                .findOne({ cognito_id: authData.client_id });
            const secondExistedUser = await db
                .collection('user')
                .findOne({ _id: userTwoId });
            if (!firstExistedUser && !secondExistedUser) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        errorMsg: 'User/Users does not exist',
                    }),
                };
            }

            // Check if user one already liked/disliked user two
            // Check liked
            const isLiked = firstExistedUser.likes.includes(
                secondExistedUser._id
            );
            if (isLiked) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        errorMsg: 'User is already being liked',
                    }),
                };
            }
            // Check disliked
            const isDisliked = firstExistedUser.dislikes.includes(
                secondExistedUser._id
            );
            if (isDisliked) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        errorMsg: 'User is already being disliked',
                    }),
                };
            }
        });

        // Make sure event.headers have the values for user one and two
        if (event.headers) {
            if (event.headers.userOneId && event.headers.userOneId != '') {
                userOneId = event.headers.userOneId;
            }

            if (event.headers.userTwoId && event.headers.userTwoId != '') {
                userTwoId = event.headers.userTwoId;
            }
        }

        // Check if the first user exists
        const firstExistedUser = await db
            .collection('user')
            .findOne({ _id: ObjectId(userOneId) });
        // Check if the second user exists
        const secondExistedUser = await db
            .collection('user')
            .findOne({ _id: ObjectId(userTwoId) });

        if (!firstExistedUser || !secondExistedUser) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: 'User/Users not exist',
                }),
            };
        }

        // Insert a data to chatbox schema
        await db.collection('chatbox').insertOne({
            user_one: firstExistedUser._id,
            user_two: secondExistedUser._id,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Chatbox successfully created',
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: `Error while creating a chatbox: ${err}`,
            }),
        };
    }
};

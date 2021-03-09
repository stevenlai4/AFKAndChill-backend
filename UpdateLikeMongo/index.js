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
    const { access_token, userTwoId } = event.headers;

    // Verify the jwt token
    if (!vertifyToken(access_token)) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                errorMsg: 'Token is undefined',
            }),
        };
    }

    return jwt.verify(access_token, 'secret', async (err, authData) => {
        // Throw error if token not matched
        if (err) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    errorMsg: 'Token not matched',
                }),
            };
        }

        try {
            // Connect to the database
            const db = await connectToDatabase();

            // Check if both users exist
            const firstExistedUser = await db
                .collection('user')
                .findOne({ cognito_id: authData.sub });
            const secondExistedUser = await db
                .collection('user')
                .findOne({ _id: ObjectId(userTwoId) });
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

            // Insert second user id into first user likes array
            await db
                .collection('user')
                .findOneAndUpdate(
                    { _id: firstExistedUser._id },
                    { $push: { likes: secondExistedUser._id } }
                );

            // Check if both users like each other
            // If YES then create a chatbox for them
            if (secondExistedUser.likes.includes(firstExistedUser._id)) {
                await db.collection('chatbox').insertOne({
                    user_one: firstExistedUser._id,
                    user_two: secondExistedUser._id,
                });
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    successMsg: 'User likes successfully',
                }),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    errorMsg: `Error while likes a user: ${err}`,
                }),
            };
        }
    });
};

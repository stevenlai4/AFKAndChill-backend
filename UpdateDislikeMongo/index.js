const { ObjectId, MongoClient } = require('mongodb');
const jwt_decode = require('jwt-decode');
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
    const { Authorization, userTwoId } = event.headers;

    // Verify the jwt token
    if (!vertifyToken(Authorization)) {
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

        // Decode the token
        const tokenData = await jwt_decode(Authorization);

        // Check if both users exist
        const firstExistedUser = await db
            .collection('user')
            .findOne({ cognito_id: tokenData.sub });
        const secondExistedUser = await db
            .collection('user')
            .findOne({ _id: ObjectId(userTwoId) });
        if (!firstExistedUser || !secondExistedUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'User/Users does not exist',
                }),
            };
        }

        // Check if user one already liked/disliked user two
        // Check liked
        const isLiked = await db.collection('user').findOne({
            _id: firstExistedUser._id,
            likes: { $in: [secondExistedUser._id] },
        });
        if (isLiked) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'User is already being liked',
                }),
            };
        }
        // Check disliked
        const isDisliked = await db.collection('user').findOne({
            _id: firstExistedUser._id,
            dislikes: { $in: [secondExistedUser._id] },
        });
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
                { $push: { dislikes: secondExistedUser._id } }
            );

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'User dislikes successfully',
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: `Error while dislikes a user: ${err}`,
            }),
        };
    }
};

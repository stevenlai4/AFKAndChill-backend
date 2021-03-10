const { ObjectId, MongoClient } = require('mongodb');
const jwt_decode = require('jwt-decode');
const MONGODB_URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.fmkwb.mongodb.net/AfkAndChillDatabase?retryWrites=true&w=majority`;
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    // Connect to our MongoDB database hosted on MongoDB Atlas...
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
    const { Authorization } = event.headers;
    const { chatboxId } = event.pathParameters;

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

        // Check if the user exists
        const existedUser = await db
            .collection('user')
            .findOne({ cognito_id: tokenData.sub });
        if (!existedUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'User does not exist',
                }),
            };
        }

        // Check if the chatbox exists
        const existedChatBox = await db
            .collection('chatbox')
            .findOne({ _id: ObjectId(chatboxId) });
        if (!existedChatBox) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'Chatbox does not exist',
                }),
            };
        }

        // Create a new message
        await db.collection('message').insertOne({
            chat_id: existedChatBox._id,
            user_id: existedUser._id,
            message: JSON.parse(event.body).message,
            timestamp: Date.now(),
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Successfully create a message',
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: `Error while sending a message: ${err}`,
            }),
        };
    }
};

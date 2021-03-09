const { MongoClient } = require('mongodb');
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
    const { Authorization } = event.headers;

    // Verify the jwt token
    // Return status code 403 if the token is undefiend
    if (!vertifyToken(Authorization)) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                errorMsg: 'Token is undefined',
            }),
        };
    }

    try {
        // Connect to mongodb database
        const db = await connectToDatabase();

        // Decode the token
        const tokenData = await jwt_decode(Authorization);

        // Check if user already exists
        // If not then return status code 400
        const existedUser = await db
            .collection('user')
            .findOne({ cognito_id: tokenData.sub });
        if (existedUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'User already exists',
                }),
            };
        }

        const body = JSON.parse(event.body);

        // Insert a new user to the user table
        await db.collection('user').insertOne({
            cognito_id: tokenData.sub,
            photo_url: body.photoUrl,
            gender: body.gender,
            genderPref: body.genderPref,
            games: body.games,
            likes: [],
            dislikes: [],
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Create user successfully',
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: `Error while creating a new user: ${err}`,
            }),
        };
    }
};

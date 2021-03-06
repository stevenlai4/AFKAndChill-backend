const MongoClient = require('mongodb').MongoClient;
const { ObjectID } = require('mongodb');
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

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const { userOneId, userTwoId } = event.headers;

    try {
        // Connect to the database
        const db = await connectToDatabase();

        // Check if the first user exists
        const firstExistedUser = await db
            .collection('user')
            .findOne({ _id: ObjectID(userOneId) });
        // Check if the second user exists
        const secondExistedUser = await db
            .collection('user')
            .findOne({ _id: ObjectID(userTwoId) });

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
            user_one: ObjectID(userOneId),
            user_two: ObjectID(userTwoId),
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

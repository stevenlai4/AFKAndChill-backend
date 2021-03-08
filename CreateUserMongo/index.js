const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
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

    try {
        const db = await connectToDatabase();

        const existedUser = await db
            .collection('user')
            .findOne({ email: event.email });
        if (existedUser) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: 'Email already exists',
                }),
            };
        }

        const encrypted = await bcrypt.hash(event.password, 12);

        await db.collection('user').insertOne({
            name: event.name,
            email: event.email,
            password: encrypted,
            gender: event.gender,
            genderPref: event.genderPref,
            games: event.games,
            chillers: [],
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
                errorMsg: 'Error while creating a ',
            }),
        };
    }
};

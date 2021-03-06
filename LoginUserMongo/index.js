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
        const same = await bcrypt.compare(password, user.password)
        const db = await connectToDatabase();
        const user = await db
            .collection('user')
            .findOne({ name: event.name });
        if (!user) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    error: 'Invalid username',
                }),
            };
        }
        if (!same) {
            return {
                stautsCode: 401,
                body: JSON.stringify({
                    error: 'Incorrect Password',
                }),
            };
        }
        await db.collection('user').findOne({name: event.name});
        return {
            user,
            statusCode: 200,
            body: 'successfully login',
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: 'error login',
        };
    }
};
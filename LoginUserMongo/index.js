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
        const user = await db
            .collection('user')
            .findOne({ email: event.email });
        if (!user) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: 'Email not found',
                }),
            };
        }
        const same = await bcrypt.compare(event.password, user.password)
        if (!same) {
            return {
                stautsCode: 401,
                body: JSON.stringify({
                    errorMsg: 'Incorrect Password',
                }),
            };
        }
        return {
            user,
            statusCode: 200,
            body: JSON.stringfy({
                successMsg: 'Login successfully'
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringfy({
                errorMsg: "Error while login user"
            }),
        };
    }
};
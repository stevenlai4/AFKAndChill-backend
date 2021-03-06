const { ObjectID } = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcryptjs");
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
    const db = client.db("AfkAndChillDatabase");
    cachedDb = db;
    return db;
}
exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const db = await connectToDatabase();
        const existedUser = await db
            .collection("user")
            .findOne({ _id: ObjectID(event.headers.id) });
        if (!existedUser) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    error: "User does not exist",
                }),
            };
        }

        // const encrypted = await bcrypt.hash(event.password, 12);
        await db.collection("message").insertOne({
            chat_id: event.chatId,
            user_id: event.userId,
            time_stamp: new Date(),
        });
        return {
            statusCode: 200,
            body: "success",
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: "error",
        };
    }
};

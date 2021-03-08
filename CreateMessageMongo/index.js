const { ObjectId, MongoClient } = require("mongodb");
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
        // Check if the user exists
        const existedUser = await db
            .collection("user")
            .findOne({ _id: ObjectId(event.headers.userId) });
        if (!existedUser) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: "User does not exist",
                }),
            };
        }
        // Check if the chatbox exists
        const existedChatBox = await db
            .collection("chatbox")
            .findOne({ _id: ObjectId(event.pathParameters.chatId) });
        if (!existedChatBox) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: "Chatbox does not exist",
                }),
            };
        }
        await db.collection("message").insertOne({
            chat_id: ObjectId(existedChatBox._id),
            user_id: ObjectId(existedUser._id),
            message: JSON.parse(event.body).message,
            timestamp: Date.now(),
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: `Success`,
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

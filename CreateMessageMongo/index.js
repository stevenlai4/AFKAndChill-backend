const { ObjectID } = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
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
            .findOne({ _id: ObjectID(event.headers.userId) });
        if (!existedUser) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: "User does not exist",
                }),
            };
        }
        //------------
        // Chat box
        //-----------

        const existedChatBox = await db
            .collection("chat")
            .findOne({ _id: ObjectID(event.headers.chatId) });
        if (!existedChatBox) {
            return {
                stautsCode: 400,
                body: JSON.stringify({
                    errorMsg: "Chatbox does not exist",
                }),
            };
        }

        await db.collection("message").insertOne({
            chat_id: event.chatId,
            user_id: event.userId,
            time_stamp: new Date(),
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
                errorMsg: `Error while sending a message`,
            }),
        };
    }
};

const { ObjectId, MongoClient } = require('mongodb');
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
    const { chatboxId } = event.pathParameters;

    try {
        // Connect to the database
        const db = await connectToDatabase();

        // Check if chatbox exists
        const existedChatbox = await db
            .collection('chatbox')
            .findOne({ _id: ObjectId(chatboxId) });
        if (!existedChatbox) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    errorMsg: 'Checkbox does not exist',
                }),
            };
        }

        // Retrieve message data
        const messages = await db
            .collection('message')
            .find({
                $query: { chat_id: ObjectId(existedChatbox._id) },
                $orderby: { timestamp: -1 },
            })
            .toArray();

        return {
            statusCode: 200,
            body: JSON.stringify({
                messages: messages,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: `Error while fetching all messages: ${err}`,
            }),
        };
    }
};

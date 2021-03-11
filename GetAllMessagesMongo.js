const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const chatboxId = event.queryParameters.chatboxId;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        const messages = await database.getAllMessages({
            chatboxId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                messages,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: error.message,
            }),
        };
    }
};

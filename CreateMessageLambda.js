const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const message = event.body.message;
    const userId = event.user.id;
    const chatboxId = event.queryParameters.chatboxId;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        await database.createMessage({
            userId,
            chatboxId,
            message,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Create message successfully',
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorMsg: error,
            }),
        };
    }
};

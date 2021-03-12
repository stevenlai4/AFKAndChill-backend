const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const userId = event.user.id;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        const chatboxes = await database.getChatboxes({
            userId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                chatboxes,
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

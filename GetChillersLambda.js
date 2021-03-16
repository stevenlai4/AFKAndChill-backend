const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const userId = event.user.id;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        const chillers = await database.getChillers({
            userId,
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                chillers,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                errorMsg: error.message,
            }),
        };
    }
};

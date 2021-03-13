const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const body = event.body;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        await database.createUser({
            ...body,
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                successMsg: 'Create user successfully',
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

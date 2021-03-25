const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    let userId = '';

    if (event.body.id) {
        userId = event.body.id;
    } else {
        userId = event.user.id;
    }

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        const user = await database.getUser({
            userId,
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                user,
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

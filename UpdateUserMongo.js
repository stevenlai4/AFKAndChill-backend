const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const body = event.body;
    const user = event.user;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Update the user
        await database.updateUser({
            ...body,
            userId: user.id,
            userName: user.name,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Update the user successfully',
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

const afkAndChillDatabase = require('/opt/afkAndChillDatabase');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const userOneId = event.user.id;
    const { userTwoId } = event.headers;

    try {
        // Get the database
        const database = await afkAndChillDatabase();

        // Create a new user
        await database.updateLike({
            userOneId,
            userTwoId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                successMsg: 'Like chiller successfully',
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

// services/session.service.js

export class SessionService {
    constructor(configuration) {
        this.sessionModel = configuration.SessionModel;
    }
    /**
     * 
     * @param {*} parameters 
     * @param {*} parameters.userId
     * @param {*} parameters.username
     * @param {*} parameters.dateOfLog
     */

    async updateSession(parameters, mongoSession = null) {
        try {
            const { userId, username, dateOfLog } = parameters;
            const sessionDoc = await this.sessionModel.findOne({ userId }).session(mongoSession).exec();
    
            if (!sessionDoc) {
                const created = await this.sessionModel.create([{
                    userId,
                    username,
                    sessionTime: [dateOfLog],
                    count: 1,
                    lastOnline: dateOfLog
                }], { session: mongoSession });
    
                return {
                    status: 200,
                    message: "Session created successfully",
                    data: created[0]
                };
            } else {
                if (new Date(dateOfLog).getTime() < new Date(sessionDoc.lastOnline).getTime() + 30 * 60 * 1000) {
                    return {
                        status: 304,
                        message: "Session not updated as the user was not active for more than 30 minutes",
                    };
                }
                const updated = await this.sessionModel.updateOne(
                    { userId },
                    {
                        $push: { sessionTime: dateOfLog },
                        $set: { lastOnline: dateOfLog },
                        $inc: { count: 1 }
                    },
                    { session: mongoSession }
                ).exec();
    
                if (updated.modifiedCount === 0) {
                    return {
                        status: 400,
                        message: "Session update failed",
                    };
                }
    
                return {
                    status: 200,
                    message: "Session updated successfully",
                    data: updated
                };
            }
        } catch (error) {
            return {
                status: 500,
                message: "An error occurred while updating the session information",
                error: error.message
            };
        }
    }

    async getSessions() {

    }
}
class SessionController {

    constructor(config) {
        this.sessionService = config.sessionService;
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
            const sessionDoc = await this.sessionService.findOne({ userId }).session(mongoSession).exec();
    
            if (!sessionDoc) {
                const created = await this.sessionService.create([{
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
                const updated = await this.sessionService.updateOne(
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
}

// export default new SessionController({sessionService: Session});
export default SessionController;

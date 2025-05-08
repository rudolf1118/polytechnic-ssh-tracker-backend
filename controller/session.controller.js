class SessionController {

    constructor(config) {
        this.sessionService = config.sessionService;
    }

    async getSessions(req, res) {
        return 
    }
}

// export default new SessionController({sessionService: Session});
export default SessionController;

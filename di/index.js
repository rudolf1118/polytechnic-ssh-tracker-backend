// * MODELS
import {
  StudentModel,
  SessionModel,
  ActivityModel,
} from '../models/models.js';

// * SERVICES
import {
  StudentService,
  SessionService,
  ActivityService,
  AuthService,
} from '../services/services.js';

// * CONTROLLERS
import {
  AuthController,
  StudentController,
  SessionController,
  ActivityController,
} from '../controllers/controllers.js';

// * SERVICE INSTANCES
const studentService = new StudentService(StudentModel);
const sessionService = new SessionService(SessionModel);
const activityService = new ActivityService(ActivityModel);
const authService = new AuthService({
  studentService,
  sessionService,
});

// * CONTROLLER INSTANCES
const studentController = new StudentController({
  studentService,
});
const sessionController = new SessionController({
  sessionService,
});
const activityController = new ActivityController({
  activityService,
});
const authController = new AuthController({
  studentService,
  sessionService,
  authService
});


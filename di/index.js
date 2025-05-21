// * DI (Dependency Injection) Module


//* Decorator

import decorator from '../utils/decorator.js';

// * Models
import {
  StudentModel,
  SessionModel,
  ActivityModel,
} from '../models/models.js';

// * Services
import {
  StudentService,
  SessionService,
  ActivityService,
  AuthService,
} from '../services/services.js';

// * Controllers
import {
  AuthController,
  StudentController,
  SessionController,
  ActivityController,
} from '../controller/controllers.js';

// * Service Instances
const studentService = new StudentService({ StudentModel, decorator });
const sessionService = new SessionService({ SessionModel });
const activityService = new ActivityService({ ActivityModel });
const authService = new AuthService({
  studentService,
  sessionService,
  decorator,
});

// * Controller Instances
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
  authService,
  decorator,
});


export {
  studentService,
  sessionService,
  activityService,
  authService,
  studentController,
  sessionController,
  activityController,
  authController,
  // StudentService,
  // SessionService,
  // ActivityService,
}
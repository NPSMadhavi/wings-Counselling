import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import teamRouter from "./team.js";
import articlesRouter from "./articles.js";
import careersRouter from "./careers.js";
import eventsRouter from "./events.js";
import uploadRouter from "./upload.js";
import candidatesRouter from "./candidates.js";
import applicationsRouter from "./applications.js";
import interviewAvailabilityRouter from "./interviewAvailability.js";
import eventSubscribersRouter from "./eventSubscribers.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(teamRouter);
router.use(articlesRouter);
router.use(careersRouter);
router.use(eventsRouter);
router.use(uploadRouter);
router.use(candidatesRouter);
router.use(applicationsRouter);
router.use(interviewAvailabilityRouter);
router.use(eventSubscribersRouter);

export default router;
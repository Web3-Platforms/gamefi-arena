import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import fightersRouter from "./fighters";
import battlesRouter from "./battles";
import trainingRouter from "./training";
import walletRouter from "./wallet";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(fightersRouter);
router.use(battlesRouter);
router.use(trainingRouter);
router.use(walletRouter);
router.use(statsRouter);

export default router;

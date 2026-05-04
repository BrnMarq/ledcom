import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";
import { upload } from "../config/multer";

const router = Router();
const controller = new TransactionController();

router.post("/", controller.create);
router.post("/bulk", controller.createBulk);
router.get("/account/:id", controller.getByAccount);
router.get("/:id", controller.getById);

// New endpoint for media context
router.post("/from-media", upload.single('file'), controller.createFromMedia);
router.post("/:id/context", upload.single('file'), controller.addContextMedia);

export default router;

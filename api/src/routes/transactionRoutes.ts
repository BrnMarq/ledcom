import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";
import { upload } from "../config/multer";

const router = Router();
const controller = new TransactionController();

router.post("/", upload.single("file"), controller.createFromMedia);
router.get("/account/:id", controller.getByAccount);
router.get("/:id", controller.getById);

export default router;

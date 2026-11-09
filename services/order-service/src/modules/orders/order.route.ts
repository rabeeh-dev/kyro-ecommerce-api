import { Router } from "express";
import * as orderController from "./order.controller.js";

const router = Router();

router.post("/", orderController.create);
router.get("/", orderController.list);
router.get("/:id", orderController.getById);
router.patch("/:id/status", orderController.updateStatus);
router.delete("/:id", orderController.remove);

export default router;

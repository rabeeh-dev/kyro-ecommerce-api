import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";

const router = Router();

router.post("/", inventoryController.create);
router.get("/", inventoryController.list);
router.get("/:id", inventoryController.getById);
router.patch("/:id", inventoryController.update);
router.delete("/:id", inventoryController.remove);

export default router;

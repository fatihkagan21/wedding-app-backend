import { Router } from "express";
import { requireAdmin } from "../../shared/middleware/admin-auth.middleware.js";
import * as controller from "./guest-list.controller.js";

const router = Router();

router.use(requireAdmin);
router.get("/event/:eventId", controller.getGuestListByEvent);
router.post("/", controller.createGuestListEntry);
router.post("/bulk", controller.createGuestListEntries);
router.post("/migrate-rsvps", controller.migrateRsvpsToGuestList);
router.patch("/:id", controller.updateGuestListEntry);
router.delete("/:id", controller.deleteGuestListEntry);

export default router;

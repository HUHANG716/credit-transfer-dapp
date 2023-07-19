import Router from "koa-router";
import courseController from "../controller/CourseController";
import institutionController from "../controller/InstitutionController";

export const router = new Router();
router.prefix("/api/v1");
router.get("/courses", courseController.getCourses);

router.get("/institutions", institutionController.getInstitutions);

import { Context, Request } from "koa";
import { courseService } from "../service/CourseService";
import Joi from "joi";
import { Course } from "../entity/Course";

class CourseController {
  getCourses = async (ctx: Context) => {
    const { from, to } = ctx.request.query;
    const { institutionAddr } = ctx.request.query;
    const { recognized } = ctx.request.query;
    const { recognizer } = ctx.request.query;
    try {
      if (from !== undefined && to !== undefined) {
        ctx.body = await courseService.getCourses(from, to);

      } else if (institutionAddr !== undefined) {
        ctx.body = await courseService.getCoursesByInstitutionAddr(institutionAddr as string);
      } else if (recognizer !== undefined) {
        ctx.body = await courseService.getRecognizedCoursesByCourseId(recognizer);
      } else if (recognized !== undefined) {
        ctx.body = await courseService.getRecognizerCoursesByCourseId(recognized);
      } else {
        throw new Error("invalid parameters");
      }
    } catch (err) {
      ctx.throw(err.message);
    }
  };

  getCourseById = async (ctx: Context) => {
    const { id } = ctx.params;
    try {
      ctx.body = await courseService.getCourseById(id);
    } catch (err) {
      ctx.throw(err.message);
    }
  };
}
const courseController = new CourseController();

export default courseController;

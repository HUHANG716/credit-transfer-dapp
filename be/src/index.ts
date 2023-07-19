import { AppDataSource } from "./data-source";
import Koa from "koa";
import { router } from "./router/router";
import bodyParser from "koa-bodyparser";
import { subscribeInstitutionRegisterEvent } from "./subscription/InstitutionSub";
import { subscribeApproveCourseSuccessEvent, subscribeApproveFnTimeoutEvent, subscribeCheckDuplicateApproveEvent, subscribeCourseRegisterEvent } from "./subscription/courseSub";
import { institutionService } from "./service/InstitutionService";
import { Institution } from "./entity/Institution";
import { courseService } from "./service/CourseService";

AppDataSource.initialize()
  .then(async () => {
    const app = new Koa();
    app.use(async (ctx, next) => {
      ctx.set("Access-Control-Allow-Origin", "*");
      ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      if (ctx.method === "OPTIONS") {
        ctx.status = 200;
      } else {
        await next();
      }
    });
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
          message: err.message,
        };
      }
    });
    app.use(bodyParser());
    app.use(router.routes()).use(router.allowedMethods());

    app.listen(3001, () => {
      console.log("server is running at http://localhost:3001");
    });
    subscribeInstitutionRegisterEvent((institution: Institution) => institutionService.createInstitution(institution));
    subscribeCheckDuplicateApproveEvent((cId, cIdToRecognize) => courseService.checkDuplicate(cId, cIdToRecognize));
    subscribeCourseRegisterEvent((course) => courseService.createCourse(course));
    subscribeApproveCourseSuccessEvent(async (courseId, courseIdToRecognize) => await courseService.addRecognizing(courseId, courseIdToRecognize));
    subscribeApproveFnTimeoutEvent();
  })
  .catch((error) => console.log(error));

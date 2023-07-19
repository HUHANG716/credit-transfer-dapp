import { Context, Request } from "koa";

import { institutionService } from "../service/InstitutionService";

class InstitutionController {
  getInstitutions = async (ctx: Context) => {
    const { from, to } = ctx.request.query;
    const { addr } = ctx.request.query;
    try {
      if (addr !== undefined) {
        ctx.body = await institutionService.getInstitutionByAddr(addr);
      } else if (from !== undefined && to !== undefined) {
        ctx.body = await institutionService.getInstitutions(from, to);
      } else {
        throw new Error("invalid parameters");
      }
    } catch (err) {
      ctx.throw(err.message);
    }
  };
}
const institutionController = new InstitutionController();

export default institutionController;

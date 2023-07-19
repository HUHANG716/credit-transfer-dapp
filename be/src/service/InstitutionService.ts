import { Repository } from "typeorm";
import { Institution } from "../entity/Institution";
import { AppDataSource } from "../data-source";

class InstitutionService {
  institutionRepository: Repository<Institution>;

  constructor() {
    this.institutionRepository = AppDataSource.getRepository(Institution);
  }
  getInstitutions(from, to) {
    return this.institutionRepository.find({
      skip: from,
      take: to - from,
    });
  }
  getInstitutionByAddr(addr) {
    return this.institutionRepository.findOne({
      where: { addr: addr },
    });
  }
  createInstitution(institution: Institution) {
    const newInstitution = {
      addr: institution.addr.toLowerCase(),
      institutionName: institution.institutionName,
    };

    return this.institutionRepository.save(newInstitution);
  }
}

export const institutionService = new InstitutionService();

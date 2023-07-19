import { EntityManager, FindOneOptions, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Course } from "../entity/Course";

class CourseService {
  coursesRepository: Repository<Course>;
  manager: EntityManager;
  constructor() {
    this.coursesRepository = AppDataSource.getRepository(Course);
    this.manager = AppDataSource.manager;
  }

  getCourses(from, to) {
    return this.coursesRepository.find({
      skip: from,
      take: to - from,
    });
  }

  getCourseById(id: number) {
    return this.coursesRepository.findOne({
      where: { id: id },
    } as FindOneOptions<Course>);
  }
  async createCourse(course: Course) {
    console.log(course);

    await this.coursesRepository.save(course);
  }
  getCoursesByInstitutionAddr(addr: string) {
    return this.coursesRepository.find({
      where: { owner: addr },
    });
  }
  async getRecognizedCoursesByCourseId(id) {
    const query = `
    SELECT recognized 
    FROM recognizers_recognized
    WHERE recognizer = :recognizerId
`;

    const result = await this.manager.query(query, [id]);

    return result.map((item) => item.recognized);
  }
  async getRecognizerCoursesByCourseId(id) {
    const query = `
    SELECT recognizer 
    FROM recognizers_recognized
    WHERE recognized = :recognizedId
`;

    const result = await this.manager.query(query, [id]);

    return result.map((item) => item.recognizer);
  }
  async addRecognizing(courseId, courseIdToRecognize) {
    const query = `
    INSERT INTO recognizers_recognized (recognizer, recognized)
    VALUES (:recognizerId, :recognizedId)
`;

    await this.manager.query(query, [courseId, courseIdToRecognize]);
  }
  checkDuplicate(courseId, courseIdToRecognize) {
    const query = `
    SELECT recognizer 
    FROM recognizers_recognized
    WHERE recognized = :recognizedId
    AND recognizer = :recognizerId
`;
    return this.manager.query(query, [courseIdToRecognize, courseId]);
  }
}

export const courseService = new CourseService();

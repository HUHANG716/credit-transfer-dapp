const CourseRegistry = artifacts.require("CourseRegistry");
const InstitutionRegistry = artifacts.require("InstitutionRegistry");
const extractError = require("./utils/extractError");
const OracleConfig = require("../oracle.config.js");

contract("CourseRegistry", async (accounts) => {
  describe("CourseRegistry", async () => {
    let insContractInstance;
    let courseContractInstance;
    before(async () => {
      insContractInstance = await InstitutionRegistry.deployed();
      courseContractInstance = await CourseRegistry.deployed();
      await insContractInstance.registerInstitution("UNSW", { from: accounts[0] });
      await insContractInstance.registerInstitution("USYD", { from: accounts[1] });
    });
    it("should add a course", async () => {
      await courseContractInstance.registerCourse("COMP8888", "0xabcd", { from: accounts[0] });
      const course = await courseContractInstance.courses(0);
      assert(course.owner, accounts[0]);
      assert(course.courseName, "COMP8888");
      assert(course.courseFileHash, "0xabcd");
      assert(course.id, 0);
    });
    it("should fail when not registered", async () => {
      try {
        await courseContractInstance.registerCourse("COMP9999", "0xabcd", { from: accounts[2] });
      } catch (err) {
        assert(extractError(err.message) === "Institution not registered");
      }
    });
    it("should fail when adding a course with invalid parameters", async () => {
      try {
        await courseContractInstance.registerCourse("", "0xabcd", { from: accounts[0] });
      } catch (err) {
        assert(extractError(err.message) === "Invalid parameters");
      }
      try {
        await courseContractInstance.registerCourse("COMP9999", "", { from: accounts[0] });
      } catch (err) {
        console.log(extractError(err.message));
        assert(extractError(err.message) === "Invalid parameters");
      }
    });
    it("should add another course with different institution", async () => {
      await courseContractInstance.registerCourse("COMP9999", "0xabcd", { from: accounts[1] });
      const course = await courseContractInstance.courses(1);
      assert(course.owner, accounts[1]);
      assert(course.courseName, "COMP9999");
      assert(course.courseFileHash, "0xabcd");
      assert(course.id, 1);
    });
    it("should fail when adding a course with institution not registered", async () => {
      try {
        await courseContractInstance.registerCourse("COMP9999", "0xabcd", { from: accounts[2] });
      } catch (err) {
        assert(extractError(err.message) === "Institution not registered");
      }
    });
    it("should fail when recognizing but not the owner", async () => {
      try {
        await courseContractInstance.recognize(0, 1, { from: accounts[1] });
      } catch (err) {
        assert(extractError(err.message) === "Not course owner");
      }
    });
    it("should store recognizing pair and lock recognize function when recognizing", async () => {
      //recognize the course
      await courseContractInstance.recognize(0, 1, { from: accounts[0] });

      const { courseId, courseIdToRecognize } = await courseContractInstance.currRecognizing();
      // should be 0 and 1
      assert(Number(courseId) === 0);
      assert(Number(courseIdToRecognize) === 1);
      const isLocked = await courseContractInstance.isInUse();
      // should be locked
      assert(isLocked);
    });
    it("should fail when invoke recognize function being locked", async () => {
      try {
        await courseContractInstance.recognize(1, 0, { from: accounts[1] });
      } catch (err) {
        assert(extractError(err.message) === "In process");
      }
    });
    it("should fail when deliver result not by oracle", async () => {
      try {
        await courseContractInstance.deliverResultIsDuplicate(false, { from: accounts[1] });
      } catch (err) {
        assert(extractError(err.message) === "Only oracle can call");
      }
    });
    it("should be added to the recognized list when result is not duplicate", async () => {
      await courseContractInstance.deliverResultIsDuplicate(false, { from: OracleConfig.oracle_addr });
      const { courseId } = await courseContractInstance.currRecognizing();

      const recognizingList = await courseContractInstance.getRecognizingCourses(Number(courseId));
      const isLocked = await courseContractInstance.isInUse();
      assert(Number(recognizingList[0]) === 1);
      assert(isLocked === false);
    });
    it("should not be added to the recognized list when result is duplicate", async () => {
      await courseContractInstance.recognize(1, 0, { from: accounts[1] });
      await courseContractInstance.deliverResultIsDuplicate(true, { from: OracleConfig.oracle_addr });
      const { courseId } = await courseContractInstance.currRecognizing();
      const recognizingList = await courseContractInstance.getRecognizingCourses(Number(courseId));
      const isLocked = await courseContractInstance.isInUse();
      assert(isLocked === false);
      assert(recognizingList.length === 0);
    });
    it("should return 2 courses registered", async () => {
      const courseList = await courseContractInstance.getCourses(0, 2);
      assert(courseList.length === 2);
    });
  });
});

import courseRegistryArtifact from "../contracts/CourseRegistry.json";
import web3 from "../config/Web3";
import { courseService } from "../service/CourseService";

const contract = new web3.eth.Contract((courseRegistryArtifact as any).abi, (courseRegistryArtifact as any).networks["5777"].address);
let timer = null;
export const subscribeCheckDuplicateApproveEvent = async (fn) => {
  // define event interface
  const jsonInterface = [
    { type: "uint256", name: "courseId" },
    { type: "uint256", name: "courseIdToRecognize" },
  ];
  // define event options
  const options = {
    address: (courseRegistryArtifact as any).networks["5777"].address,
    topics: [web3.utils.sha3("CheckDuplicateApproveEvent(uint256,uint256)")],
  };

  // subscribe event
  const subscription = await web3.eth.subscribe("logs", options);

  // handle event data
  subscription.on("data", async (event) => {
    const eventData = web3.eth.abi.decodeLog(jsonInterface, event.data, event.topics);

    try {
      const courses = await fn(Number(eventData.courseId), Number(eventData.courseIdToRecognize));

      if (courses.length > 0) {
        (contract.methods as any).deliverResultIsDuplicate(true).send({ from: web3.eth.defaultAccount });

        console.info("Duplicate! Clear the timer.");
      } else {
        (contract.methods as any).deliverResultIsDuplicate(false).send({ from: web3.eth.defaultAccount });
        console.log("Not duplicate. Deliver this msg.");
      }
      timer && clearTimeout(timer);
    } catch (e) {
      console.error(e.message);
    }
  });
  subscription.on("error", async (error) => {
    console.log(error);
  });
};
export const subscribeApproveCourseSuccessEvent = async (addRecognizing) => {
  const jsonInterface = [
    { type: "uint256", name: "courseId" },
    { type: "uint256", name: "courseIdToRecognize" },
  ];
  const options = {
    address: (courseRegistryArtifact as any).networks["5777"].address,
    topics: [web3.utils.sha3("ApproveCourseSuccessEvent(uint256,uint256)")],
  };
  const subscription = await web3.eth.subscribe("logs", options);
  subscription.on("data", async (event) => {
    const eventData = web3.eth.abi.decodeLog(jsonInterface, event.data, event.topics);
    const courseId = Number(eventData.courseId);
    const courseIdToRecognize = Number(eventData.courseIdToRecognize);

    console.log("Approvement success! Add into db...");
    ////add into db
    await addRecognizing(courseId, courseIdToRecognize);
    console.info(`[db:insert] ${courseId} recognized ${courseIdToRecognize}`);
    timer && clearTimeout(timer);
  });
  subscription.on("error", async (error) => {
    console.log(error);
  });
};

export const subscribeApproveFnTimeoutEvent = async () => {
  const jsonInterface = [];
  const options = {
    address: (courseRegistryArtifact as any).networks["5777"].address,
    topics: [web3.utils.sha3("ApproveFnTimeoutEvent()")],
  };
  const subscription = await web3.eth.subscribe("logs", options);
  subscription.on("data", async (event) => {
    const eventData = web3.eth.abi.decodeLog(jsonInterface, event.data, event.topics);
    //if timeout, we think it is duplicate and the approve function will be unlock
    console.log("Timer set!");
    timer = setTimeout(() => {
      //unlock the approve function
      (contract.methods as any).deliverResultIsDuplicate(true).send({ from: web3.eth.defaultAccount });
      console.log("Timeout! release the approving function.");
    }, 1000 * 10);
  });
  subscription.on("error", async (error) => {
    console.log(error);
  });
};
export const subscribeCourseRegisterEvent = async (addCourse) => {
  const jsonInterface = [
    { type: "uint256", name: "courseId" },
    { type: "address", name: "owner" },
    { type: "string", name: "courseName" },
    { type: "string", name: "courseFileHash" },
  ];
  const options = {
    address: (courseRegistryArtifact as any).networks["5777"].address,
    topics: [web3.utils.sha3("CourseRegisterEvent(uint256,address,string,string)")],
  };
  const subscription = await web3.eth.subscribe("logs", options);
  subscription.on("data", async (event) => {
    const eventData = web3.eth.abi.decodeLog(jsonInterface, event.data, event.topics);

    try {
      const course = {
        id: Number(eventData.courseId),
        courseName: eventData.courseName,
        courseFileHash: eventData.courseFileHash,
        owner: (eventData.owner as string).toLowerCase(),
      };

      await addCourse(course);
      console.info(`[db:insert] ${JSON.stringify(course)}`);
    } catch (e) {
      console.error(e.message);
    }
  });
  subscription.on("error", async (e) => {
    console.error(e.message);
  });
};

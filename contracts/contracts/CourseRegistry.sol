// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./InstitutionRegistry.sol";

contract CourseRegistry {
    InstitutionRegistry public institutionRegistry;
    address public oracleAddress;

    constructor(address _institutionRegistry, address _oracleAddress) {
        institutionRegistry = InstitutionRegistry(_institutionRegistry);
        oracleAddress = _oracleAddress;
    }

    event CheckDuplicateApproveEvent(uint courseId, uint courseIdToRecognize);
    event CourseRegisterEvent(
        uint courseId,
        address owner,
        string courseName,
        string courseFileHash
    );

    event CheckApproveFnTimeoutEvent();
    event ApproveCourseSuccessEvent(uint courseId, uint courseIdToRecognize);

    struct Course {
        uint id;
        address owner;
        string courseName;
        string courseFileHash;
        uint[] recognizingCourses;
    }
    struct RecognizingDto {
        uint courseId;
        uint courseIdToRecognize;
    }
    //all courses list
    Course[] public courses;
    //store the current recognizing course id and the course id to recognize
    RecognizingDto currRecognizing;
    //if in recognizing process, lock the approve function in case of reentrancy
    bool isInUse = false;

    function registerCourse(
        string calldata courseName,
        string calldata courseFileHash
    ) external returns (Course memory) {
        bool isRegistered = institutionRegistry.isInstitutionRegistered(
            msg.sender
        );
        require(isRegistered, "___Institution not registered___");
        require(
            bytes(courseName).length != 0 && bytes(courseFileHash).length != 0,
            "___Invalid Paramaters___"
        );

        Course memory newCourse = Course(
            courses.length,
            msg.sender,
            courseName,
            courseFileHash,
            new uint[](0)
        );
        courses.push(newCourse);
        emit CourseRegisterEvent(
            newCourse.id,
            newCourse.owner,
            newCourse.courseName,
            newCourse.courseFileHash
        );
        return newCourse;
    }

    function approveCourse(uint courseId, uint courseIdToRecognize) external {
        bool isRegistered = institutionRegistry.isInstitutionRegistered(
            msg.sender
        );
        require(isRegistered, "___Institution not registered___");
        //need this course belongs to this institution
        require(
            courses[courseId].owner == msg.sender,
            "___Not course owner___"
        );
        require(!isInUse, "___In process___");
        //lock the function
        isInUse = true;
        //store the course id and the course id to recognize
        currRecognizing = RecognizingDto(courseId, courseIdToRecognize);
        //inform the oracle to check if the course is already recognized
        emit CheckDuplicateApproveEvent(courseId, courseIdToRecognize);
        //inform the oracle to timeout the process after some time
        emit CheckApproveFnTimeoutEvent();
    }

    function deliverResultIsDuplicate(bool isDuplicate) external {
        require(msg.sender == oracleAddress, "___Only oracle can call___");
        require(isInUse, "___Not in process___");
        if (isDuplicate) {
            isInUse = false;
        } else {
            //if not duplicate, add the course id to the recognizing course's recognizingCourses array
            courses[currRecognizing.courseId].recognizingCourses.push(
                currRecognizing.courseIdToRecognize
            );

            //inform the oracle the process is done and close the timer for this process
            emit ApproveCourseSuccessEvent(
                currRecognizing.courseId,
                currRecognizing.courseIdToRecognize
            );

            isInUse = false;
        }
    }

    //if timeout, oracle will call this function to unlock the approve function
    function timeoutApproveProcess() public {
        require(msg.sender == oracleAddress, "___Only oracle can call___");
        require(isInUse, "___Not in process___");
        //if timeout, unlock the function
        isInUse = false;
    }

    function getCourses(
        uint from,
        uint to
    ) public view returns (Course[] memory) {
        require(from >= 0 && to >= from, "___Invalid Paramaters___");
        uint amount = to - from;
        //if amount is greater than the length of the array, return the whole array
        if (amount > courses.length) {
            amount = courses.length;
        }

        Course[] memory _courses = new Course[](amount);

        for (uint i = 0; i < amount; i++) {
            _courses[i] = courses[from + i];
        }
        return _courses;
    }
}

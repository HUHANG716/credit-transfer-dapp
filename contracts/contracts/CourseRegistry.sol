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

    // define structs
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
    RecognizingDto public currRecognizing;
    //if in recognizing process, lock the approve function in case of reentrancy
    bool public isInUse = false;

    // define events
    event CheckDuplicateApproveEvent(uint courseId, uint courseIdToRecognize);
    event CheckApproveFnTimeoutEvent();
    event ApproveCourseSuccessEvent(uint courseId, uint courseIdToRecognize);
    event CourseRegisterEvent(
        uint courseId,
        address owner,
        string courseName,
        string courseFileHash
    );

    function registerCourse(
        string calldata courseName,
        string calldata courseFileHash
    ) external onlyRegisteredInstitution returns (Course memory) {
        require(
            bytes(courseName).length != 0 && bytes(courseFileHash).length != 0,
            "___Invalid parameters___"
        );

        Course memory newCourse = Course(
            courses.length,
            msg.sender,
            courseName,
            courseFileHash,
            new uint[](0)
        );
        courses.push(newCourse);
        //inform the server to add the course to the database
        emit CourseRegisterEvent(
            newCourse.id,
            newCourse.owner,
            newCourse.courseName,
            newCourse.courseFileHash
        );
        return newCourse;
    }

    function recognize(
        uint courseId,
        uint courseIdToRecognize
    )
        external
        onlyRegisteredInstitution
        onlyCourseOwner(courseId)
        onlyNotInuse
    {
        //lock the function
        isInUse = true;
        //store the course id and the course id to recognize
        currRecognizing = RecognizingDto(courseId, courseIdToRecognize);
        //inform the oracle to check if the course is already recognized
        emit CheckDuplicateApproveEvent(courseId, courseIdToRecognize);
        //inform the oracle to timeout the process after some time
        emit CheckApproveFnTimeoutEvent();
    }

    //oracle calls this function to inform the contract the validation result
    //if timeout, the oracle will call this function with isDuplicate = true
    function deliverResultIsDuplicate(
        bool isDuplicate
    ) external onlyOracle onlyInuse {
        //if not duplicate, add the course id to the recognizing course's recognizingCourses array
        if (!isDuplicate) {
            //if not duplicate, add the course id to the recognizing course's recognizingCourses array
            courses[currRecognizing.courseId].recognizingCourses.push(
                currRecognizing.courseIdToRecognize
            );

            //inform the oracle the process is done and close the timer for this process
            emit ApproveCourseSuccessEvent(
                currRecognizing.courseId,
                currRecognizing.courseIdToRecognize
            );
        }
        //unlock the function
        isInUse = false;
    }

    function getCourses(
        uint from,
        uint to
    ) public view returns (Course[] memory) {
        require(from >= 0 && to >= from, "___Invalid paramaters___");
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

    function getRecognizingCourses(
        uint courseId
    ) public view returns (uint[] memory) {
        return courses[courseId].recognizingCourses;
    }

    //modifiers
    modifier onlyRegisteredInstitution() {
        require(
            institutionRegistry.isInstitutionRegistered(msg.sender),
            "___Institution not registered___"
        );
        _;
    }
    modifier onlyCourseOwner(uint courseId) {
        require(
            courses[courseId].owner == msg.sender,
            "___Not course owner___"
        );
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "___Only oracle can call___");
        _;
    }

    modifier onlyInuse() {
        require(isInUse, "___Not In process___");
        _;
    }
    modifier onlyNotInuse() {
        require(!isInUse, "___In process___");
        _;
    }
}

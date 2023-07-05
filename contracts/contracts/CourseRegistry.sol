// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./InstitutionRegistry.sol";

contract CourseRegistry {
    InstitutionRegistry public institutionRegistry;

    constructor(address _institutionRegistry) {
        institutionRegistry = InstitutionRegistry(_institutionRegistry);
    }

    uint public id = 0;
    struct Course {
        uint id;
        address owner;
        string courseName;
        string courseFileHash;
    }
    mapping(uint => Course) public coursesDict;

    //if course1 recognizes course2, then IsCourseRecognized[1][2] = true
    mapping(uint => mapping(uint => bool)) public IsCourseRecognized;
    //all courses that have recognized this course
    mapping(uint => uint[]) public recognizingCourses;
    //all courses that this course has recognized
    mapping(uint => uint[]) public recognizedCourses;
    //all courses list
    Course[] public courses;
    //all courses of an institution
    mapping(address => Course[]) public coursesOfInstitution;

    function registerCourse(
        string calldata courseName,
        string calldata courseFileHash
    ) external returns (Course memory) {
        bool isRegistered = institutionRegistry.registeredInstitution(
            msg.sender
        );
        require(isRegistered, "___Institution not registered___");
        require(
            bytes(courseName).length != 0 && bytes(courseFileHash).length != 0,
            "___Invalid Paramaters___"
        );
        Course memory newCourse = Course(
            id,
            msg.sender,
            courseName,
            courseFileHash
        );
        coursesDict[id] = newCourse;
        courses.push(newCourse);
        coursesOfInstitution[msg.sender].push(newCourse);
        id++;
        return newCourse;
    }

    function approveCourse(uint courseId, uint courseIdToRecognize) external {
        bool isRegistered = institutionRegistry.registeredInstitution(
            msg.sender
        );
        require(isRegistered, "___Institution not registered___");
        //need this course belongs to this institution
        require(
            courses[courseId].owner == msg.sender,
            "___Not course owner___"
        );
        //need this course is not approved by this courseId
        require(
            IsCourseRecognized[courseId][courseIdToRecognize] == false,
            "___Course already recognized!___"
        );
        IsCourseRecognized[courseId][courseIdToRecognize] = true;
        //add the course to the recognizingCourses array
        recognizingCourses[courseId].push(courseIdToRecognize);
        //add the course to the coursesRecognized array
        recognizedCourses[courseIdToRecognize].push(courseId);
    }

    function getCourses(
        uint from,
        uint to
    ) public view returns (Course[] memory) {
        require(from >= 0 && to > 0, "___Invalid Paramaters___");
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

    function getCoursesByInstitution(
        address institutionAddress,
        uint from,
        uint to
    ) external view returns (Course[] memory) {
        require(from >= 0 && to > 0, "___Invalid Paramaters___");
        uint amount = to - from;
        //if amount is greater than the length of the array, return the whole array
        if (amount > coursesOfInstitution[institutionAddress].length) {
            amount = coursesOfInstitution[institutionAddress].length;
        }
        Course[] memory _courses = new Course[](amount);

        for (uint i = 0; i < amount; i++) {
            _courses[i] = coursesOfInstitution[institutionAddress][from + i];
        }
        return _courses;
    }

    function getRecognizingCoursesByCourseId(
        uint courseId
    ) external view returns (uint[] memory) {
        require(
            bytes(courses[courseId].courseName).length != 0,
            "___Course not registered___"
        );

        return recognizingCourses[courseId];
    }

    function getRecognizedCoursesByCourseId(
        uint courseId
    ) external view returns (uint[] memory) {
        require(
            bytes(courses[courseId].courseName).length != 0,
            "___Course not registered___"
        );

        return recognizedCourses[courseId];
    }
}

import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Web3 from "web3";
import courseRegistryArtifact from "./contracts/CourseRegistry.json";
import institutionRegistryArtifact from "./contracts/InstitutionRegistry.json";
import { err, success, warn } from "./utils/alert";
import { extractError } from "./utils/extractError";
import { isEqualToCurrAddr } from "./utils/isEqualToCurrAddr";
import { Select, MenuItem, Button, Popover, Tabs, Tab, TextField, Modal, Box, Link, CircularProgress } from "@mui/material";
import { TabPanel, a11yProps } from "./components/TabPanel";
import SelectTable from "./components/SelectTable";
import { create } from "ipfs-http-client";
import { getIPFSResourceUrl } from "./utils/getIPFSRsourceUrl";

export interface Course {
  owner: string;
  courseFileHash: string;
  courseName: string;
  id: number;
}
interface Institution {
  addr: string;
  institutionName: string;
}
interface RegisterDto {
  courseName: string;
  courseFileHash: string;
}
type Address = string;
const baseUrl = "http://localhost:3001/api/V1/";
function App() {
  const courseRegistryContract = useRef<any>();
  const institutionRegistryContract = useRef<any>();
  const fileInput = useRef<any>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [courseFile, setCourseFile] = useState<File>();
  const ipfsRequestInfo = useRef<any>({
    host: process.env.REACT_APP_IPFS_HOST, // IPFS daemon address
    port: Number(process.env.REACT_APP_IPFS_PORT), // IPFS daemon port
    protocol: process.env.REACT_APP_IPFS_PROTOCOL, // IPFS protocol
    apiPath: process.env.REACT_APP_IPFS_API_PATH,
  });

  const web3 = useRef<Web3>();
  const { host, port, protocol, apiPath } = ipfsRequestInfo.current;

  const ipfs = useRef<any>(
    create({
      host, // IPFS daemon address
      port, // IPFS daemon port
      protocol, // IPFS protocol
      apiPath,
      headers: {
        authorization: "Basic " + btoa(((process.env.REACT_APP_INFURA_IPFS_KEY as string) + ":" + process.env.REACT_APP_INFURA_IPFS_KEY_SECRET) as string),
      },
    })
  );
  const [currAccount, setCurrAccount] = useState<string>("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [insName, setInsName] = useState<string>("");
  const [allRegisteredCourses, setAllRegisteredCourses] = useState<Course[]>([]);
  const [allRegisteredCoursesByInstitution, setAllRegisteredCoursesByInstitution] = useState<Record<Address, Course[]>>({});
  const [courseName, setCourseName] = useState<string>("");
  const [recognizingCourses, setRecognizingCourses] = useState<Record<number, Course[]>>({});
  const [recognizedCourses, setRecognizedCourses] = useState<Record<number, Course[]>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course>({ id: -1 } as any);
  const [anchorEl, setAnchorEl] = useState<Record<string, EventTarget & HTMLButtonElement>>({});
  const [IDexpanded, setIDExpanded] = useState<number>(-1);

  const handleAcknowledge = (event: React.MouseEvent<HTMLButtonElement>, popoverId: string) => {
    if (Number(selectedCourse.id) === -1) {
      err("Please select a course first! ");
      return;
    }
    setAnchorEl((prev: any) => ({ ...prev, [popoverId]: event.currentTarget }));
    console.log(event.currentTarget);
  };
  const handlePopoverClose = (popoverId: string) => {
    setAnchorEl((prev: any) => ({ ...prev, [popoverId]: null }));
  };
  const handleAccountsChanged = (accounts: string[]) => {
    setCurrAccount(accounts[0].toLowerCase());
  };

  async function uploadFile(file: File) {
    try {
      const created = await ipfs.current.add(file);
      //IPFS gateway url
      const url = getIPFSResourceUrl(created.path);

      console.log("Access your data at:", url);
      return created.path;
    } catch (error: any) {
      throw error;
    }
  }
  useEffect(() => {
    const init = async () => {
      //check if metamask is installed
      if (!window.ethereum) {
        err("Non-Ethereum browser detected. You should consider trying MetaMask!");
        return;
      }

      web3.current = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });
        success("Account access granted");
        // Acccounts now exposed
      } catch (error: any) {
        //fail to get account access
        warn(error.message);
      }
      //get current account
      setCurrAccount(window.ethereum.selectedAddress);

      //create the contract instance
      courseRegistryContract.current = new web3.current.eth.Contract(courseRegistryArtifact.abi, courseRegistryArtifact.networks["5777"].address);

      institutionRegistryContract.current = new web3.current.eth.Contract(institutionRegistryArtifact.abi, institutionRegistryArtifact.networks["5777"].address);

      //get all institutions
      getInstitutions();
      //get all courses
      getCourses();

      //listen to account change
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    };
    //init
    init();
  }, []);
  const registerInstitution = async () => {
    if (!insName) return;
    try {
      await institutionRegistryContract.current.methods.registerInstitution(insName).send({
        from: currAccount,
      });
      success("Institution registered successfully");
      getInstitutions();
    } catch (error: any) {
      const result = extractError(error.message);
      result ? err(result) : err(error.message);
    }
    setInsName("");
  };
  const registerCourse = async (registerDto: RegisterDto) => {
    const { courseName, courseFileHash } = registerDto;
    try {
      await courseRegistryContract.current.methods.registerCourse(courseName, courseFileHash).send({
        from: currAccount,
      });

      getCourses();
      setCourseName("");
      setCourseFile(undefined);

      success("Course registered successfully");
    } catch (error: any) {
      const result = extractError(error.message);
      result ? err(result) : err(error.message);

      err(error.message);
    }
  };

  const getCourses = async (from: number = 0, to: number = 999) => {
    try {
      const courses: Course[] = await (await fetch(baseUrl + "courses?from=" + from + "&to=" + to)).json();
      setAllRegisteredCourses(courses);
    } catch (error: any) {
      err(error.message);
    }
  };
  const getInstitutions = async (from: number = 0, to: number = 99) => {
    try {
      const institutions = await (await fetch(baseUrl + "institutions?from=" + from + "&to=" + to)).json();
      console.log(institutions);

      setInstitutions(institutions);
    } catch (error: any) {
      err(error.message);
    }
  };

  const approveCourse = async (recognizingCourseId: number, recognizedCourseId: number) => {
    try {
      await courseRegistryContract.current.methods.recognize(recognizingCourseId, recognizedCourseId).send({
        from: currAccount,
      });
      success("Course recognizing request sent!");
    } catch (error: any) {
      err(extractError(error.message));
    }
  };
  const getRecognizedCoursesByCourseId = async (courseId: number) => {
    try {
      const recognizingCourses = await (await fetch(baseUrl + "courses?recognizer=" + courseId)).json();

      const _recognizingCourses = recognizingCourses.map((courseId: number) => ({
        id: courseId,
        courseName: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.courseName,
        owner: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.owner,
        courseFileHash: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.courseFileHash,
      }));

      setRecognizingCourses((prev) => ({ ...prev, [Number(courseId)]: _recognizingCourses }));
      console.log(_recognizingCourses);
    } catch (error: any) {
      err(extractError(error.message));
    }
  };
  const getRecognizerCoursesByCourseId = async (courseId: number) => {
    try {
      const recognizedCourses = await (await fetch(baseUrl + "courses?recognized=" + courseId)).json();
      const _recognizedCourses = recognizedCourses.map((courseId: number) => ({
        id: courseId,
        courseName: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.courseName,
        owner: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.owner,
        courseFileHash: allRegisteredCourses.find((course) => Number(course.id) === Number(courseId))?.courseFileHash,
      }));

      setRecognizedCourses((prev) => ({ ...prev, [Number(courseId)]: _recognizedCourses }));
      console.log(_recognizedCourses);
    } catch (error: any) {
      err(extractError(error.message));
    }
  };

  const getCoursesByInstitution = async (institutionAddr: Address) => {
    try {
      const courses = await (await fetch(baseUrl + "courses?institutionAddr=" + institutionAddr)).json();
      setAllRegisteredCoursesByInstitution((prev) => ({ ...prev, [institutionAddr.toLowerCase()]: courses }));
      console.log(courses);
    } catch (error: any) {
      err(error.message);
    }
  };
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <div className="App">
      <div
        style={{
          backgroundColor: "#1876d2",
          color: "#fff",
          width: "fit-content",
          padding: 5,
          borderRadius: 10,
          margin: "auto",
        }}>
        <strong>Current Address: </strong>
        <span>{currAccount}</span>
      </div>

      <div>
        {institutions.some((institution) => isEqualToCurrAddr(currAccount, institution.addr)) ? (
          <></>
        ) : (
          <div>
            <div
              style={{
                margin: "10px",
                color: "red",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "center",

                alignItems: "center",
              }}>
              You have not registered as an institution yet!
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}>
              <TextField label="Institution Name" variant="standard" value={insName} onChange={(e) => setInsName(e.target.value)} type="text" />
              <Button variant="contained" onClick={registerInstitution}>
                Register
              </Button>
            </div>
          </div>
        )}
      </div>

      <h3>Institutions List</h3>

      <div className="table-container">
        <table>
          <tbody>
            {institutions.map((institution, index) => (
              <>
                <tr className={index === IDexpanded ? "bottom-borderless" : ""} key={institution.addr}>
                  <td
                    style={{
                      boxSizing: "border-box",
                      padding: "0 50px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                    <span
                      style={{
                        color: isEqualToCurrAddr(currAccount, institution.addr) ? "red" : "ActiveBorder",
                      }}>
                      <strong>Name: </strong>
                      {institution.institutionName}
                    </span>
                    {isEqualToCurrAddr(currAccount, institution.addr) ? (
                      <span
                        style={{
                          color: "red",
                          fontWeight: 700,
                        }}>
                        You
                      </span>
                    ) : (
                      institution.addr
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ width: "fit-content", m: 1, height: 30, fontWeight: "bold" }}
                      onClick={() => {
                        getCoursesByInstitution(institution.addr);
                        setIDExpanded((prev) => (index === prev ? -1 : index));
                      }}>
                      View registered courses in this institution
                    </Button>
                  </td>
                </tr>
                <tr hidden={IDexpanded !== index}>
                  <td>
                    <div
                      className="table-container"
                      style={{
                        margin: "10px",
                        // width: "1000px",
                        border: "1px solid #000",
                        minHeight: "50px",
                      }}>
                      <table>
                        {allRegisteredCoursesByInstitution[institution.addr]?.length === 0 ? (
                          <div style={{ marginTop: "10px", color: "red", fontWeight: "bold", fontSize: "20px" }}>Haven't registered any course yet !</div>
                        ) : (
                          <>
                            <thead>
                              <tr>
                                {["ID", "Course Name", "Recognized", "Recognized by"].map((title) => (
                                  <th key={title} className="subtable-th">
                                    {title}
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            {allRegisteredCoursesByInstitution[institution.addr]?.map((course, index) => (
                              <tr key={Number(course.id)}>
                                <td>{Number(course.id)}</td>
                                <td>
                                  <Link underline="always" href={getIPFSResourceUrl(course.courseFileHash)}>
                                    {course.courseName}
                                  </Link>
                                </td>

                                <td>
                                  <Select
                                    onSelect={(e) => {
                                      e.preventDefault();
                                    }}
                                    value={-1}
                                    sx={{ width: "fit-content", m: 1, height: 30 }}
                                    displayEmpty
                                    onOpen={() => getRecognizedCoursesByCourseId(course.id)}>
                                    <MenuItem disabled value={-1}>
                                      Expand to view
                                    </MenuItem>
                                    <SelectTable emptyPlaceholder="No course recognized yet" data={recognizingCourses[Number(course.id)]} header={["ID", "Name"]} secondData={recognizingCourses[Number(course.id)]} />
                                  </Select>
                                </td>
                                <td>
                                  <Select
                                    onSelect={(e) => {
                                      e.preventDefault();
                                    }}
                                    value={-1}
                                    sx={{
                                      width: "fit-content",
                                      m: 1,
                                      height: 30,
                                    }}
                                    displayEmpty
                                    onOpen={(e) => {
                                      getRecognizerCoursesByCourseId(course.id);
                                    }}>
                                    <MenuItem disabled value={-1}>
                                      Expand to view
                                    </MenuItem>
                                    <SelectTable emptyPlaceholder="No course recognize this course" data={recognizedCourses[Number(course.id)]} header={["ID", "Name"]} secondData={recognizedCourses[Number(course.id)]} />
                                  </Select>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </table>
                    </div>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Course Register</h3>
      <div>
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Register a Course
        </Button>
      </div>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "fit-content",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <TextField label="Course Name" variant="standard" value={courseName} onChange={(e) => setCourseName(e.target.value)} type="text" />
          </div>
          <div
            style={{
              marginTop: "40px",
              marginLeft: "30px",
            }}>
            <input
              ref={fileInput}
              style={{
                width: "fit-content",
                display: "none",
              }}
              onChange={(e) => {
                if (!e.target.files) return;
                setCourseFile(e.target.files[0]);
                console.log(e.target.files[0]);
              }}
              type="file"
              id="myFile"
              name="filename"
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}>
            {!courseFile ? "Please upload a course file" : courseFile.name}{" "}
            <Button
              sx={{
                marginLeft: "20px",
                w: 50,
                height: 30,
                fontWeight: "bold",
              }}
              variant="outlined"
              onClick={() => {
                fileInput.current.click();
              }}>
              Upload
            </Button>
          </div>

          <Button
            disabled={isLoading}
            sx={{
              mt: 2,
            }}
            variant="contained"
            onClick={async () => {
              if (!courseName) {
                err("Please enter course name");
                return;
              }
              if (!courseFile) {
                err("Please upload a file");
                return;
              }
              setIsLoading(true);
              try {
                const fileHash = await uploadFile(courseFile);

                await registerCourse({
                  courseName: courseName,
                  courseFileHash: fileHash,
                });
              } catch (error: any) {
                err(error.message);
                setIsLoading(false);
              }

              setIsModalOpen(false);
              setIsLoading(false);
            }}>
            {isLoading ? <CircularProgress /> : "Register"}
          </Button>
        </Box>
      </Modal>
      <hr />
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}>
        <Tabs onChange={handleChange} value={value} aria-label="basic tabs example">
          <Tab sx={{ fontWeight: "700 !important" }} label="Course List" {...a11yProps(0)} />
          <Tab sx={{ fontWeight: "700 !important" }} label="My Recognized Courses" {...a11yProps(1)} />
        </Tabs>
        <div>
          <span>Current: </span>
          <Select
            sx={{ width: "fit-content", m: 1, height: 40 }}
            displayEmpty
            onOpen={() => {
              //get registered courses by current institution
              getCoursesByInstitution(currAccount);
            }}
            value={Number(selectedCourse.id)}
            onChange={(e) => {
              const id = Number(e.target.value);
              const course = allRegisteredCoursesByInstitution[currAccount].find((course) => Number(course.id) === id);
              getRecognizedCoursesByCourseId(id);
              setSelectedCourse(course as any);
            }}>
            <MenuItem disabled value={-1}>
              Choose a course to recognize another course
            </MenuItem>

            {allRegisteredCoursesByInstitution[currAccount]?.map((course, index) => (
              <MenuItem
                style={{
                  overflow: "hidden",
                }}
                key={Number(course.id)}
                value={Number(course.id)}>
                <span
                  style={{
                    width: "100px",
                  }}>
                  <strong>ID:</strong>
                  {Number(course.id)}&nbsp;
                </span>
                <span>
                  <strong> Course Name:&nbsp;</strong>
                </span>
                <Link underline="always" href={getIPFSResourceUrl(course.courseFileHash)}>
                  {course.courseName}
                </Link>
              </MenuItem>
            ))}
          </Select>
        </div>
      </div>
      <TabPanel value={value} index={0}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Course Name</th>
                <th>Publisher</th>

                <th>Recognized</th>
                <th>Recognized by</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allRegisteredCourses
                .map((course, index) => (
                  <tr key={Number(course.id)}>
                    <td>{Number(course.id)}</td>
                    <td>
                      <Link underline="always" href={getIPFSResourceUrl(course.courseFileHash)}>
                        {course.courseName}
                      </Link>
                    </td>
                    <td>{isEqualToCurrAddr(currAccount, course.owner) ? "You" : course.owner}</td>

                    <td>
                      <Select
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                        value={-1}
                        sx={{ width: "fit-content", m: 1, height: 30 }}
                        displayEmpty
                        onOpen={(e) => {
                          getRecognizedCoursesByCourseId(course.id);
                        }}>
                        <MenuItem disabled value={-1}>
                          Expand to view
                        </MenuItem>
                        <SelectTable emptyPlaceholder="This course has not recognized any course" data={recognizingCourses[Number(course.id)]} header={["ID", "Name"]} secondData={recognizingCourses[Number(course.id)]} />
                      </Select>
                    </td>
                    <td>
                      <Select
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                        value={-1}
                        sx={{
                          width: "fit-content",
                          m: 1,
                          height: 30,
                        }}
                        displayEmpty
                        onOpen={(e) => {
                          getRecognizerCoursesByCourseId(course.id);
                        }}>
                        <MenuItem disabled value={-1}>
                          Expand to view
                        </MenuItem>
                        <SelectTable emptyPlaceholder="No course recognize this course" data={recognizedCourses[Number(course.id)]} header={["ID", "Name"]} secondData={recognizedCourses[Number(course.id)]} />
                      </Select>
                    </td>

                    <td>
                      {isEqualToCurrAddr(currAccount, course.owner) ? (
                        "This is your course"
                      ) : recognizingCourses[Number(selectedCourse.id)]?.some((_course) => Number(_course.id) === Number(Number(course.id))) ? (
                        "Recognized✅"
                      ) : (
                        <div>
                          <Button
                            size="small"
                            sx={{ width: "fit-content", m: 1, height: 30, fontSize: 12 }}
                            aria-describedby={index.toString()}
                            disableRipple
                            variant="contained"
                            onClick={(e) => {
                              handleAcknowledge(e, index.toString());
                            }}>
                            Recognize
                          </Button>
                          <Popover
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "center",
                            }}
                            onClose={() => handlePopoverClose(index.toString())}
                            anchorEl={anchorEl[index.toString()]}
                            id={index.toString()}
                            open={Boolean(anchorEl[index.toString()])}>
                            <div
                              style={{
                                padding: 10,
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column",
                                width: 500,
                              }}>
                              <div
                                style={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  fontSize: 20,
                                }}>
                                Are you sure to do this?
                              </div>
                              <div
                                style={{
                                  borderTop: "1px solid #000",
                                }}>
                                Course from your institution:
                                <div>Name: {selectedCourse.courseName} </div>
                                <div> ID: {Number(selectedCourse.id)}</div>
                                <div>Owner: You</div>
                              </div>

                              <div
                                style={{
                                  borderTop: "1px solid #000",
                                }}>
                                Course from other institution:
                                <div>Name: {course.courseName}</div>
                                <div>ID: {Number(course.id)}</div>
                                <div>Owner: {course.owner.toLowerCase()}</div>
                              </div>
                              <Button
                                onClick={() => {
                                  approveCourse(selectedCourse.id, course.id).then(() => {
                                    getRecognizedCoursesByCourseId(selectedCourse.id);
                                  });

                                  handlePopoverClose(index.toString());
                                }}
                                sx={{ mt: 2 }}
                                variant="contained">
                                Confirm
                              </Button>
                            </div>
                          </Popover>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
                .reverse()}
            </tbody>
          </table>
        </div>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <div className="table-container">
          <table>
            <thead>
              <th>ID</th>
              <th>Course Name</th>
              <th>Publisher</th>
              <th>Resource</th>
            </thead>
            <tbody>
              {recognizingCourses[Number(selectedCourse.id)]?.map((course, index) => (
                <tr key={Number(course.id)}>
                  <td>{Number(course.id)}</td>
                  <td>
                    <Link underline="always" href={getIPFSResourceUrl(course.courseFileHash)}>
                      {course.courseName}
                    </Link>
                  </td>
                  <td>{isEqualToCurrAddr(currAccount, course.owner) ? "You" : course.owner}</td>
                  <td> {course.courseFileHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabPanel>
    </div>
  );
}

export default App;

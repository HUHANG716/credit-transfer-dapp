const InstitutionRegistry = artifacts.require("InstitutionRegistry");
const CourseRegistry = artifacts.require("CourseRegistry");
const OracleConfig = require("../oracle.config.js");

module.exports = async function (_deployer) {
  // Use deployer to state migration tasks.
  await _deployer.deploy(InstitutionRegistry);
  const institutionRegistry = await InstitutionRegistry.deployed();
  //write to the disk

  await _deployer.deploy(CourseRegistry, institutionRegistry.address, OracleConfig.oracle_addr);
};

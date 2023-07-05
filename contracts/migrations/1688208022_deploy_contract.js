const InstitutionRegistry = artifacts.require("InstitutionRegistry");
const CourseRegistry = artifacts.require("CourseRegistry");

module.exports = async function (_deployer) {
  // Use deployer to state migration tasks.
  await _deployer.deploy(InstitutionRegistry);
  const institutionRegistry = await InstitutionRegistry.deployed();

  await _deployer.deploy(CourseRegistry, institutionRegistry.address);
};

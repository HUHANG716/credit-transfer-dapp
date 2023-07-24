const institutionRegistry = artifacts.require("InstitutionRegistry");
const extractError = require("./utils/extractError");

contract("InstitutionRegistry", async (accounts) => {
  describe("InstitutionRegistry", async () => {
    let contractInstance;
    before(async () => {
      contractInstance = await institutionRegistry.deployed();
    });
    it("should add a institution", async () => {
      await contractInstance.registerInstitution("UNSW", { from: accounts[0] });

      // isRegistered should be true
      assert(await contractInstance.isInstitutionRegistered(accounts[0]));

      const { institutionAddress } = await contractInstance.registeredInstitutionList(0);
      // should be added to the institution list
      assert(institutionAddress === accounts[0]);
    });
    it("should fail when registering with the invalid parameters", async () => {
      try {
        await contractInstance.registerInstitution("", { from: accounts[1] });
      } catch (err) {
        assert(extractError(err.message) === "Invalid parameters");
      }
    });
    it("should fail when using same address to add an institution", async () => {
      try {
        await contractInstance.registerInstitution("UNSW", { from: accounts[0] });
      } catch (err) {
        assert(extractError(err.message) === "Institution is already registered");
      }
    });
    it("should get 3 institutions when calling getInstitutions", async () => {
      await contractInstance.registerInstitution("UNI_1", { from: accounts[1] });
      await contractInstance.registerInstitution("UNI_2", { from: accounts[2] });
      const institutionList = await contractInstance.getInstitutions(0, 3, { from: accounts[0] });
      assert(institutionList.length === 3);
    });
  });
});

import institutionRegistryArtifact from "../contracts/InstitutionRegistry.json";
import web3 from "../config/Web3";

export const subscribeInstitutionRegisterEvent = async (addIns) => {
  const jsonInterfaceInstitutionRegisterEvent = [
    { type: "address", name: "institutionAddress" },
    { type: "string", name: "name" },
  ];

  const optionsInstitutionRegisterEvent = {
    address: (institutionRegistryArtifact as any).networks["5777"].address,
    topics: [web3.utils.sha3("InstitutionRegisterEvent(address,string)")],
  };

  const subscriptionInstitutionRegisterEvent = await web3.eth.subscribe("logs", optionsInstitutionRegisterEvent);

  subscriptionInstitutionRegisterEvent.on("data", async (event) => {
    const eventData = web3.eth.abi.decodeLog(jsonInterfaceInstitutionRegisterEvent, event.data, event.topics);
    try {
      const ins = {
        addr: eventData.institutionAddress,
        institutionName: eventData.name,
      };
      await addIns(ins);
      console.info(`[db:insert] ${JSON.stringify(ins)}`);
    } catch (e) {
      console.error(e.message);
    }
  });

  subscriptionInstitutionRegisterEvent.on("error", async (e) => {
    console.error(e.message);
  });
};

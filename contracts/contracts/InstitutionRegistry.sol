// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract InstitutionRegistry {
    // Mapping to check if an institution is registered
    mapping(address => bool) public isInstitutionRegistered;
    event InstitutionRegisterEvent(address institutionAddress, string name);
    struct Institution {
        address institutionAddress;
        string name;
    }
    // Array to store all the registered institutions
    Institution[] public registeredInstitutionList;

    function registerInstitution(
        string calldata name
    ) external onlyUnregisteredInstitution {
        // Add the institution to the mapping and add the address to the array
        isInstitutionRegistered[msg.sender] = true;
        Institution memory newInstitution = Institution(msg.sender, name);
        registeredInstitutionList.push(newInstitution);
        //inform the server to add the institution to the database
        emit InstitutionRegisterEvent(msg.sender, name);
    }

    function getAllInstitutions(
        uint from,
        uint to
    ) external view returns (Institution[] memory) {
        require(from >= 0 && to > from, "___Invalid Paramaters___");
        uint amount = to - from;
        //if amount is greater than the length of the array, return the whole array
        if (amount > registeredInstitutionList.length) {
            amount = registeredInstitutionList.length;
        }
        Institution[] memory institutions = new Institution[](amount);

        for (uint i = 0; i < amount; i++) {
            institutions[i] = registeredInstitutionList[from + i];
        }
        return institutions;
    }

    modifier onlyUnregisteredInstitution() {
        require(
            !isInstitutionRegistered[msg.sender],
            "___Institution  is already registered___"
        );
        _;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract InstitutionRegistry {
    mapping(address => bool) public registeredInstitution;
    address[] public institutionAddresses;

    function registerInstitution() public {
        // Check if the institution is already registered
        require(
            !registeredInstitution[msg.sender],
            "___Institution is already registered___"
        );
        // Add the institution to the mapping and add the address to the array
        registeredInstitution[msg.sender] = true;
        institutionAddresses.push(msg.sender);
    }

    function getAllInstitutions() external view returns (address[] memory) {
        return institutionAddresses;
    }
}

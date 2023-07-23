// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.00 <0.9.0;

import "remix_tests.sol";
import "remix_accounts.sol";
import "../contracts/InstitutionRegistry.sol";

contract InstitutionRegistryTest is InstitutionRegistry {
    address acc0;
    address acc1;
    address acc2;
    address acc3;
    address acc4;

    function beforeAll() public {
        acc0 = TestsAccounts.getAccount(0);
        acc1 = TestsAccounts.getAccount(1);
        acc2 = TestsAccounts.getAccount(2);
        acc3 = TestsAccounts.getAccount(3);
        acc4 = TestsAccounts.getAccount(4);
    }

    function testGetAllInstitutions() public {
        this.registerInstitution("UNSW");
        Institution[] memory institutions = this.getAllInstitutions(0, 100);
        Assert.equal(institutions[0].name, "UNSW", "Institution name is not correct");
    }

    function testRegistringAgain() public {
        this.registerInstitution("UNSW");
        string memory errorMessage;
        try this.registerInstitution("UNSW") {
            errorMessage = "___Institution is already registered___";
        } catch (bytes memory errorData) {
            errorMessage = string(errorData);
        }
    }

    function testRegisterManyInstitutions() public {
        this.registerInstitution("UNSW");
        this.registerInstitution("USyd");
        Institution[] memory institutions = this.getAllInstitutions(0, 100);
        Assert.equal(institutions[0].name, "UNSW", "Institution name is not correct");
        Assert.equal(institutions[1].name, "USyd", "Institution name is not correct");
    }
}

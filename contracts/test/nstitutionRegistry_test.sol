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

    function beforeAll () public {
        acc0 = TestsAccounts.getAccount(0);
        acc1 = TestsAccounts.getAccount(1);
        acc2 = TestsAccounts.getAccount(2);
        acc3 = TestsAccounts.getAccount(3);
        acc4 = TestsAccounts.getAccount(4);
    }

    /// #sender: account-1
    function testRegisterInstitution() public {
        this.registerInstitution("UNSW");
    }
}

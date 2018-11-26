/**
 * @description Unit tests for verifying Adjustor contract functions
 * @copyright (c) 2017 HIC Limited (NZBN: 9429043400973)
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
const expect = require('expect.js');
const miscFunc = require("../misc/miscFunc.js");
const td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Adjustor is SetupI, IntAccessI
// event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
// ----------------

// createAdjustor(address _adjustorAdr, uint _settlementApprovalAmount_Cu, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
exports.createAdjustor = async (_adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement) => {
    // Store the hash map info for now
    const adjustorHashMapInfo = await td.adjustor.hashMap();
    // Create a new Adjustor via the trust contract signing with the Trust's authorisation keys
    const tx = await td.trust.createAdjustor(_adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement, {from: td.accounts[0]});
    // Extract the decoded logs
    const logs = td.abiDecoder.decodeLogs(tx.receipt.rawLogs);

    // Get the adjustor hash
    const adjustorHash = miscFunc.verifyAdjustorLog(logs, 0);
    // Save the adjustor hash
    td.aHash[adjustorHashMapInfo[1].toNumber()] = adjustorHash;
    
    // 3 Event are triggered as part of the adjustor creation
    miscFunc.verifyAdjustorLog(logs, 0, adjustorHash, _adjustorAdr, _settlementApprovalAmount_Cu, null);
    miscFunc.verifyAdjustorLog(logs, 1, adjustorHash, _adjustorAdr, _policyRiskPointLimit, null);
    miscFunc.verifyAdjustorLog(logs, 2, adjustorHash, _adjustorAdr, _serviceAgreement, null);

    // Call the function to verify all adjustor data
    await miscFunc.verifyAdjustorData(await td.adjustor.dataStorage.call(adjustorHash), adjustorHashMapInfo[1].toNumber(), _adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement);
    
    // Verify the adjustor has been added to the hash map
    miscFunc.verifyHashMap(adjustorHashMapInfo, await td.adjustor.hashMap(), true);
}

// updateAdjustor(bytes32 _adjustorHash, address _adjustorAdr, uint _settlementApprovalAmount_Cu, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
exports.updateAdjustor = async (_adjustorHash, _adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement) => {
    // Store the hash map info for now
    const adjustorHashMapInfo = await td.adjustor.hashMap();
    // Create a new Adjustor via the trust contract signing with the Trust's authorisation keys
    const tx = await td.trust.updateAdjustor(_adjustorHash, _adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement, {from: td.accounts[0]});
    // Extract the decoded logs
    const logs = td.abiDecoder.decodeLogs(tx.receipt.rawLogs);

    // 3 Event are triggered as part of the adjustor update
    miscFunc.verifyAdjustorLog(logs, 0, _adjustorHash, _adjustorAdr, _settlementApprovalAmount_Cu, null);
    miscFunc.verifyAdjustorLog(logs, 1, _adjustorHash, _adjustorAdr, _policyRiskPointLimit, null);
    miscFunc.verifyAdjustorLog(logs, 2, _adjustorHash, _adjustorAdr, _serviceAgreement, null);
  
    // Call the function to verify all adjustor data
    await miscFunc.verifyAdjustorData(await td.adjustor.dataStorage.call(_adjustorHash), null, _adjustorAdr, _settlementApprovalAmount_Cu, _policyRiskPointLimit, _serviceAgreement);
    
    // Verify if the hash map nextIdx, count values stayed the same
    miscFunc.verifyHashMap(adjustorHashMapInfo, await td.adjustor.hashMap(), null);
}

// retireAdjustor(bytes32 _adjustorHash)
exports.retireAdjustor = async (_adjustorHash) => {
    // Store the hash map info for now
    const adjustorHashMapInfo = await td.adjustor.hashMap();
    // Retire Adjustor via the trust contract signing with the Trust's authorisation keys
    const tx = await td.trust.retireAdjustor(_adjustorHash, {from: td.accounts[0]});
    // Extract the decoded logs
    const logs = td.abiDecoder.decodeLogs(tx.receipt.rawLogs);

    // 1 event is triggered as part of the adjustor retirement
    miscFunc.verifyAdjustorLog(logs, 0, _adjustorHash, miscFunc.getEmptyAdr(), 0, null);

    // Verify the hash has been archived and not active any more
    expect(await td.adjustor.isActive.call(_adjustorHash)).to.be.equal(false);
    expect(await td.adjustor.isArchived.call(_adjustorHash)).to.be.equal(true);

    // Call the function to verify all adjustor data
    await miscFunc.verifyAdjustorData(await td.adjustor.dataStorage.call(_adjustorHash), null, miscFunc.getEmptyAdr(), 0, 0, null);

    // Verify if the hash map count value has decreased
    miscFunc.verifyHashMap(adjustorHashMapInfo, await td.adjustor.hashMap(), false);
}
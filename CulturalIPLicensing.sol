// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
contract CulturalIPLicensing is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable eAU; address public treasury; address public elderCouncil;
    struct IPAsset { uint256 id; address owner; string title; string ipfsHash; uint256 royaltyBps; bool active; uint256 totalEarned; }
    struct Licence { uint256 id; uint256 assetId; address licensee; uint256 durationDays; uint256 price; bool active; }
    mapping(uint256 => IPAsset) public assets; mapping(uint256 => Licence) public licences;
    uint256 public assetCount; uint256 public licenceCount;
    event AssetRegistered(uint256 indexed id, address indexed owner, string title);
    event LicenceIssued(uint256 indexed id, uint256 assetId, address licensee, uint256 price);
    constructor(address _multisig, address _eAU, address _treasury, address _elder) Ownable(_multisig) { eAU=IERC20(_eAU); treasury=_treasury; elderCouncil=_elder; }
    function registerIP(string calldata _title, string calldata _ipfs, uint256 _bps) external returns (uint256 id) {
        require(msg.sender==elderCouncil || msg.sender==owner(), "Elder only"); id = assetCount++; assets[id]=IPAsset(id, msg.sender, _title, _ipfs, _bps, true, 0); emit AssetRegistered(id, msg.sender, _title);
    }
    function issueLicence(uint256 _assetId, uint256 _days, uint256 _price) external nonReentrant returns (uint256 id) {
        require(assets[_assetId].active, "Not active"); eAU.safeTransferFrom(msg.sender, address(this), _price);
        eAU.safeTransfer(treasury, _price); assets[_assetId].totalEarned += _price;
        id = licenceCount++; licences[id]=Licence(id, _assetId, msg.sender, _days, _price, true); emit LicenceIssued(id, _assetId, msg.sender, _price);
    }
    function setTreasury(address _t) external onlyOwner { treasury=_t; }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StreamFi {
    struct Stream {
        uint256 rate;
        uint256 lastClaim;
        bool active;
    }

    mapping(address => Stream) public streams;
    mapping(address => uint256) public balances;

    uint256 public constant MIN_CLAIM_INTERVAL = 5;

    event StreamStarted(address indexed user, uint256 rate);
    event StreamStopped(address indexed user);
    event StreamClaimed(address indexed user, uint256 amount);

    function startStream(uint256 _rate) external {
        require(_rate > 0, "Rate must be positive");
        Stream storage s = streams[msg.sender];
        s.rate = _rate;
        s.lastClaim = block.timestamp;
        s.active = true;
        emit StreamStarted(msg.sender, _rate);
    }

    function stopStream() external {
        Stream storage s = streams[msg.sender];
        require(s.active, "Stream not active");
        s.active = false;
        emit StreamStopped(msg.sender);
    }

    function claimStream() external {
        Stream storage s = streams[msg.sender];
        require(s.rate > 0, "No stream found");
        require(block.timestamp >= s.lastClaim + MIN_CLAIM_INTERVAL, "Claim too soon");

        uint256 timePassed = block.timestamp - s.lastClaim;
        uint256 amount = timePassed * s.rate;

        balances[msg.sender] += amount;
        s.lastClaim = block.timestamp;

        emit StreamClaimed(msg.sender, amount);
    }

    function getBalance(address _user) external view returns (uint256) {
        Stream storage s = streams[_user];
        
        if (s.active && s.rate > 0) {
            uint256 timePassed = block.timestamp - s.lastClaim;
            uint256 pendingTokens = timePassed * s.rate;
            return balances[_user] + pendingTokens;
        }
        
        return balances[_user];
    }

    // This function fixes the "getClaimedBalance is not a function" error
    function getClaimedBalance(address _user) external view returns (uint256) {
        return balances[_user];
    }
}

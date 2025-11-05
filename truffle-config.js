// truffle-config.js
// This file tells Truffle how to connect to Ganache and which Solidity version to use

module.exports = {
  networks: {
    // Configuration for local Ganache blockchain
    development: {
      host: "127.0.0.1",      // Localhost (same computer)
      port: 7545,              // Ganache runs on port 7545
      network_id: "*"          // Match any network id (Ganache generates random ones)
    }
  },
  
  compilers: {
    solc: {
      version: "0.8.21",       // Solidity compiler version (matches your contract)
      settings: {
        optimizer: {
          enabled: true,       // Optimize compiled code for gas efficiency
          runs: 200            // Balance between deployment cost and runtime cost
        }
      }
    }
  }
};

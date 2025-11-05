// simulate.js — Backend simulation using Ganache private key
// This script demonstrates how blockchain transactions work behind the scenes

const { ethers } = require("ethers");
const fs = require("fs");

// === STEP 1: Load the deployed smart contract ===
// After truffle migrate, contract details are saved in build/contracts/StreamFi.json
const contractJson = JSON.parse(fs.readFileSync("./build/contracts/StreamFi.json", "utf-8"));
const abi = contractJson.abi;  // ABI = Application Binary Interface (how to call contract functions)
const networkIds = Object.keys(contractJson.networks);

// Check if contract is deployed
if (networkIds.length === 0)
  throw new Error("❌ No deployed networks found. Run `truffle migrate --reset` first!");

// Get the latest deployed address
const latestNetworkId = networkIds[networkIds.length - 1];
const contractAddress = contractJson.networks[latestNetworkId].address;
console.log("✅ Using contract at:", contractAddress);

// === STEP 2: Connect to Ganache blockchain ===
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");

// FIXED: Use deterministic Ganache account (0)
// This private key NEVER changes when you start Ganache with --deterministic flag
// Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
// Balance: 1000 ETH (fake money for testing)
const privateKey = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";

const wallet = new ethers.Wallet(privateKey, provider);
const streamFi = new ethers.Contract(contractAddress, abi, wallet);

// === STEP 3: Helper function to advance blockchain time ===
// In real blockchain, time moves naturally. In Ganache, we can fast-forward for testing.
async function advanceTime(seconds) {
  await provider.send("evm_increaseTime", [seconds]);  // Move time forward
  await provider.send("evm_mine");                      // Mine a new block
  console.log(`⏰ Advanced blockchain time by ${seconds} seconds.`);
}

// === STEP 4: Start the payment stream ===
// This function checks if stream is already running, if not, starts it
async function startStreamIfNeeded() {
  const address = await wallet.getAddress();
  const s = await streamFi.streams(address);  // Read stream data from blockchain
  
  if (!s.active) {
    console.log("ℹ️  No active stream found — starting a new one...");
    // startStream(3) = 3 tokens per second payment rate
    const tx = await streamFi.startStream(3);
    const receipt = await tx.wait();  // Wait for transaction to be mined
    console.log(`🚀 Stream started! Block: ${receipt.blockNumber}, Tx: ${tx.hash}`);
  } else {
    console.log("✅ Stream already active.");
  }
}

// === STEP 5: Claim accumulated tokens ===
// Tokens accumulate based on: (current_time - last_claim_time) × rate
async function claimTokensCycle() {
  const address = await wallet.getAddress();
  try {
    const tx = await streamFi.claimStream();
    const receipt = await tx.wait();
    const balance = await streamFi.getBalance(address);
    console.log(
      `💰 Claimed | Block: ${receipt.blockNumber} | Balance: ${balance.toString()} tokens`
    );
  } catch (err) {
    console.log("⚠️  Claim failed:", err.reason || err.message);
  }
}

// === STEP 6: Stop the stream ===
async function stopStreamSafely() {
  try {
    const tx = await streamFi.stopStream();
    const receipt = await tx.wait();
    console.log(`🛑 Stream stopped | Block: ${receipt.blockNumber}`);
  } catch (err) {
    console.log("⚠️  Stop failed:", err.message);
  }
}

// === MAIN SIMULATION ===
// This runs when you execute: node simulate.js
async function main() {
  const address = await wallet.getAddress();
  console.log("👤 Connected as:", address);
  
  const balance = await provider.getBalance(address);
  console.log("💵 ETH Balance:", ethers.utils.formatEther(balance), "ETH");
  
  await startStreamIfNeeded();
  
  console.log("\n⏳ Starting simulation (6 cycles, 6 seconds each)...\n");
  
  // Run 6 cycles: advance time → claim tokens
  for (let i = 1; i <= 6; i++) {
    console.log(`--- Cycle ${i} ---`);
    await advanceTime(6);        // Fast-forward 6 seconds
    await claimTokensCycle();    // Claim tokens earned in those 6 seconds
    console.log("");
  }
  
  await stopStreamSafely();
  const finalBalance = await streamFi.getBalance(address);
  console.log(`\n🏁 Final token balance: ${finalBalance.toString()} tokens`);
}

main().catch(console.error);

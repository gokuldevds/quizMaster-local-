/**
 * Migration script to initialize quiz statistics and ranks for all existing users
 * Run this once after updating the user schema to populate quizStats for existing users
 * 
 * Usage: node backend/scripts/initializeRanks.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Result = require("../models/resultModel");
const { calculateAndUpdateRanks } = require("../utils/rankCalculator");

const connectDB = require("../connection");

async function initializeRanks() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();

    console.log("📊 Initializing quiz statistics and ranks for all users...");
    const count = await calculateAndUpdateRanks();
    
    console.log(`✅ Successfully initialized ranks for ${count} users`);
    console.log("✨ Migration completed!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing ranks:", error);
    process.exit(1);
  }
}

// Run the migration
initializeRanks();


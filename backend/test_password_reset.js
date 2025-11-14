const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/userModel');

async function testPasswordReset() {
  try {
    // Connect to DB directly
    const mongo_url = process.env.MONGO_URL || 'mongodb+srv://roshanwilson024:zQYlZhMxyQu0q87u@cluster0.krulohd.mongodb.net/QuizMaster?appName=Cluster0';
    await mongoose.connect(mongo_url);
    console.log('Connected to MongoDB');

    // Create a test user
    const testEmail = 'test@example.com';
    const oldPassword = 'oldpassword123';
    const newPassword = 'newpassword123';

    // Remove existing test user if any
    await User.findOneAndDelete({ email: testEmail });

    // Create new test user
    const user = new User({
      name: 'Test User',
      email: testEmail,
      password: oldPassword,
      role: 'user'
    });
    await user.save();

    console.log('Test user created with email:', testEmail);

    // Simulate password reset
    const userBeforeReset = await User.findOne({ email: testEmail }).select('+password');
    console.log('Password before reset (hashed):', userBeforeReset.password);

    // Update password (simulating the reset-password endpoint logic)
    userBeforeReset.password = newPassword;
    await userBeforeReset.save();

    // Fetch user after reset
    const userAfterReset = await User.findOne({ email: testEmail }).select('+password');
    console.log('Password after reset (hashed):', userAfterReset.password);

    // Verify the new password works
    const isNewPasswordValid = await bcrypt.compare(newPassword, userAfterReset.password);
    const isOldPasswordValid = await bcrypt.compare(oldPassword, userAfterReset.password);

    console.log('New password matches:', isNewPasswordValid);
    console.log('Old password still works:', isOldPasswordValid);

    if (isNewPasswordValid && !isOldPasswordValid) {
      console.log('✅ Password reset test PASSED: New password is correctly hashed and stored in DB');
    } else {
      console.log('❌ Password reset test FAILED');
    }

    // Clean up
    await User.findOneAndDelete({ email: testEmail });
    console.log('Test user cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPasswordReset();

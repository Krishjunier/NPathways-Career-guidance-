const crypto = require("crypto");

// Environment variables
const OTP_SECRET = process.env.OTP_SECRET;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");
const OTP_RESEND_COOLDOWN = parseInt(process.env.OTP_RESEND_COOLDOWN || "60");
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || "5");

/**
 * Note: Twilio integration has been removed from this application.
 * This OTP service now only provides local validation utilities.
 * To send actual OTPs, you will need to implement an alternative SMS/email provider.
 */

/**
 * Validate phone number format (E.164)
 * E.164 format: +[country code][number]
 * Example: +91XXXXXXXXXX
 */
const validatePhoneNumber = (phone) => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP using HMAC-SHA256
 * @param {string} otp - The OTP to hash
 * @returns {string} - Hashed OTP (hex format)
 */
const hashOTP = (otp) => {
  return crypto.createHmac("sha256", OTP_SECRET).update(otp).digest("hex");
};

/**
 * Get OTP collection from database
 */
const getOTPCollection = async () => {
  try {
    const db = global.mongodb;
    if (!db) {
      throw new Error("MongoDB connection not initialized");
    }
    return db.collection("otpStore");
  } catch (error) {
    console.error("Error getting OTP collection:", error);
    throw error;
  }
};

/**
 * Check rate limiting status for a phone number
 * Returns: { canSend: boolean, reason?: string, retryAfter?: number }
 */
const checkRateLimitStatus = async (phone) => {
  try {
    const collection = await getOTPCollection();

    // Get the most recent OTP record for this phone
    const recentOTP = await collection.findOne(
      { phone },
      { sort: { createdAt: -1 } }
    );

    if (!recentOTP) {
      return { canSend: true };
    }

    // Check if max attempts reached
    if (recentOTP.attempts >= MAX_OTP_ATTEMPTS) {
      return {
        canSend: false,
        reason: `Maximum OTP attempts (${MAX_OTP_ATTEMPTS}) exceeded. Please try again later.`,
        locked: true,
      };
    }

    // Check resend cooldown
    const timeSinceLastSend =
      Date.now() - new Date(recentOTP.createdAt).getTime();
    const cooldownMs = OTP_RESEND_COOLDOWN * 1000;

    if (timeSinceLastSend < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);
      return {
        canSend: false,
        reason: `Please wait ${retryAfter} seconds before requesting a new OTP`,
        retryAfter,
      };
    }

    return { canSend: true };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    throw error;
  }
};

/**
 * Send OTP to a phone number
 * NOTE: Twilio integration has been removed. This is now a stub function.
 * To send actual OTPs, implement an alternative SMS/email provider.
 */
const sendOTP = async (phone) => {
  return {
    success: false,
    message:
      "OTP sending functionality has been disabled. Twilio integration removed. Please implement an alternative SMS provider.",
  };
};

/**
 * Verify OTP
 * Steps:
 * 1. Validate phone format
 * 2. Retrieve OTP record from MongoDB
 * 3. Check if OTP is expired
 * 4. Hash provided OTP
 * 5. Compare hashes
 * 6. Mark OTP as consumed on success
 * 7. Log verification event
 */
const verifyOTP = async (phone, enteredOtp) => {
  try {
    // Validate phone format
    if (!validatePhoneNumber(phone)) {
      return {
        success: false,
        message: "Invalid phone number format",
      };
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(enteredOtp)) {
      return {
        success: false,
        message: "Invalid OTP format. Must be 6 digits.",
      };
    }

    // Retrieve OTP record
    const collection = await getOTPCollection();
    const otpRecord = await collection.findOne(
      { phone },
      { sort: { createdAt: -1 } }
    );

    if (!otpRecord) {
      await logEvent("OTP_VERIFY_FAILED", phone, "no_record", {
        reason: "No OTP record found",
      });

      return {
        success: false,
        message:
          "No OTP found for this phone number. Please request a new one.",
      };
    }

    // Check if OTP is already consumed
    if (otpRecord.consumed) {
      await logEvent("OTP_VERIFY_FAILED", phone, "already_consumed", {
        consumedAt: otpRecord.consumedAt,
      });

      return {
        success: false,
        message: "OTP has already been used. Please request a new one.",
      };
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await logEvent("OTP_VERIFY_FAILED", phone, "expired", {
        expiresAt: otpRecord.expiresAt,
      });

      return {
        success: false,
        message: "OTP has expired. Please request a new one.",
      };
    }

    // Hash provided OTP
    const hashedInputOtp = hashOTP(enteredOtp);

    // Compare hashes
    if (hashedInputOtp !== otpRecord.hashedOtp) {
      // Increment attempts
      await collection.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } }
      );

      await logEvent("OTP_VERIFY_FAILED", phone, "incorrect", {
        attemptNumber: otpRecord.attempts + 1,
        maxAttempts: MAX_OTP_ATTEMPTS,
      });

      // Check if max attempts exceeded
      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        return {
          success: false,
          message: `Incorrect OTP. Maximum attempts (${MAX_OTP_ATTEMPTS}) exceeded.`,
          locked: true,
        };
      }

      return {
        success: false,
        message: `Incorrect OTP. ${
          MAX_OTP_ATTEMPTS - otpRecord.attempts
        } attempts remaining.`,
        attemptsRemaining: MAX_OTP_ATTEMPTS - otpRecord.attempts,
      };
    }

    // OTP is correct - mark as consumed
    const consumedAt = new Date();
    await collection.updateOne(
      { _id: otpRecord._id },
      {
        $set: {
          consumed: true,
          consumedAt,
          updatedAt: consumedAt,
        },
      }
    );

    // Log successful verification
    await logEvent("OTP_VERIFY_SUCCESS", phone, "success", {
      consumedAt,
      usedAttempts: otpRecord.attempts + 1,
    });

    return {
      success: true,
      message: "OTP verified successfully",
      verifiedAt: consumedAt,
    };
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    await logEvent("OTP_VERIFY_ERROR", phone, "error", {
      error: error.message,
    });

    return {
      success: false,
      message: "An error occurred while verifying OTP",
    };
  }
};

/**
 * Log OTP events for audit trail
 * Event types: OTP_SEND_SUCCESS, OTP_SEND_FAILED, OTP_VERIFY_SUCCESS, OTP_VERIFY_FAILED, etc.
 */
const logEvent = async (eventType, phone, status, details = {}) => {
  try {
    const db = global.mongodb;
    if (!db) return;

    const otpLogsCollection = db.collection("otpLogs");

    const logRecord = {
      eventType,
      phone,
      status,
      details,
      timestamp: new Date(),
      userAgent: details.userAgent || null,
    };

    await otpLogsCollection.insertOne(logRecord);
  } catch (error) {
    console.error("Error logging OTP event:", error);
  }
};

/**
 * Clean up expired OTPs (can be called periodically)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const collection = await getOTPCollection();
    const result = await collection.deleteMany({
      expiresAt: { $lt: new Date() },
      consumed: true,
    });

    console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
};

/**
 * Get OTP statistics for a phone number
 */
const getOTPStats = async (phone) => {
  try {
    const collection = await getOTPCollection();

    const record = await collection.findOne(
      { phone },
      { sort: { createdAt: -1 } }
    );

    if (!record) {
      return null;
    }

    return {
      phone,
      attempts: record.attempts,
      maxAttempts: MAX_OTP_ATTEMPTS,
      consumed: record.consumed,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      consumedAt: record.consumedAt || null,
    };
  } catch (error) {
    console.error("Error getting OTP stats:", error);
    throw error;
  }
};

// Backward compatibility - legacy function names
const validateOTP = (generatedOTP, userOTP) => {
  return String(generatedOTP) === String(userOTP);
};

const generateOTPWithExpiry = (expiryMinutes = 5) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  return { otp, expiresAt };
};

// Export functions
module.exports = {
  generateOTP,
  hashOTP,
  validatePhoneNumber,
  sendOTP,
  verifyOTP,
  checkRateLimitStatus,
  logEvent,
  cleanupExpiredOTPs,
  getOTPStats,
  // Legacy exports for backward compatibility
  validateOTP,
  generateOTPWithExpiry,
};

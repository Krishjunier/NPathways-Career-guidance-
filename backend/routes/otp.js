const express = require("express");
const router = express.Router();
const otpService = require("../utils/otpService");

/**
 * POST /api/otp/send
 *
 * Request body:
 * {
 *   "phone": "+91XXXXXXXXXX"  // E.164 format
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "OTP sent successfully",
 *   "expiresAt": "2024-01-15T10:30:00Z",
 *   "maskedPhone": "+91XXXXXXXX10"
 * }
 *
 * Response (400):
 * {
 *   "success": false,
 *   "message": "Invalid phone number format. Use E.164 format (e.g., +91XXXXXXXXXX)"
 * }
 *
 * Response (429):
 * {
 *   "success": false,
 *   "message": "Please wait 45 seconds before requesting a new OTP",
 *   "retryAfter": 45
 * }
 */
router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate input
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Call OTP service
    const result = await otpService.sendOTP(phone);

    // Determine response status
    let statusCode = 200;

    if (!result.success) {
      // Rate limit - 429, Invalid format - 400, Other errors - 500
      if (result.retryAfter) {
        statusCode = 429; // Too Many Requests
      } else if (result.message.includes("Invalid phone number format")) {
        statusCode = 400; // Bad Request
      } else {
        statusCode = 500; // Internal Server Error
      }
    }

    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error in /otp/send route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/otp/verify
 *
 * Request body:
 * {
 *   "phone": "+91XXXXXXXXXX",  // E.164 format
 *   "otp": "123456"             // 6-digit OTP
 * }
 *
 * Response (200 - Success):
 * {
 *   "success": true,
 *   "message": "OTP verified successfully",
 *   "verifiedAt": "2024-01-15T10:32:00Z"
 * }
 *
 * Response (400 - Invalid format):
 * {
 *   "success": false,
 *   "message": "Invalid phone number format"
 * }
 *
 * Response (401 - Incorrect OTP):
 * {
 *   "success": false,
 *   "message": "Incorrect OTP. 4 attempts remaining.",
 *   "attemptsRemaining": 4
 * }
 *
 * Response (403 - Account locked):
 * {
 *   "success": false,
 *   "message": "Incorrect OTP. Maximum attempts (5) exceeded.",
 *   "locked": true
 * }
 *
 * Response (410 - OTP expired or consumed):
 * {
 *   "success": false,
 *   "message": "OTP has expired. Please request a new one."
 * }
 */
router.post("/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate input
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!otp || typeof otp !== "string") {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Call OTP service
    const result = await otpService.verifyOTP(phone, otp);

    // Determine response status
    let statusCode = 200;

    if (!result.success) {
      if (result.locked) {
        statusCode = 403; // Forbidden - Account locked
      } else if (
        result.message.includes("Invalid") ||
        result.message.includes("format")
      ) {
        statusCode = 400; // Bad Request
      } else if (result.message.includes("Incorrect")) {
        statusCode = 401; // Unauthorized - Wrong OTP
      } else if (
        result.message.includes("expired") ||
        result.message.includes("already been used")
      ) {
        statusCode = 410; // Gone - OTP no longer valid
      } else {
        statusCode = 500; // Internal Server Error
      }
    }

    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error in /otp/verify route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/otp/stats/:phone
 *
 * Get OTP statistics for a phone number
 *
 * Response (200):
 * {
 *   "phone": "+91XXXXXXXXXX",
 *   "attempts": 2,
 *   "maxAttempts": 5,
 *   "consumed": false,
 *   "expiresAt": "2024-01-15T10:30:00Z",
 *   "createdAt": "2024-01-15T10:25:00Z",
 *   "consumedAt": null
 * }
 *
 * Response (404):
 * {
 *   "success": false,
 *   "message": "No OTP found for this phone number"
 * }
 */
router.get("/stats/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    // Validate phone format
    if (!otpService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    const stats = await otpService.getOTPStats(phone);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "No OTP found for this phone number",
      });
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in /otp/stats route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching OTP statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/otp/cleanup
 *
 * Admin endpoint to cleanup expired OTPs
 * Should be called periodically (e.g., via cron job)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Cleanup completed",
 *   "deletedCount": 42
 * }
 */
router.post("/cleanup", async (req, res) => {
  try {
    // Optional: Add authentication check here
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Forbidden' });
    // }

    const deletedCount = await otpService.cleanupExpiredOTPs();

    res.status(200).json({
      success: true,
      message: "Cleanup completed",
      deletedCount,
    });
  } catch (error) {
    console.error("Error in /otp/cleanup route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during cleanup",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Export router
module.exports = router;

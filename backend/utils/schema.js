// backend/utils/schema.js
/**
 * ensureCollections(db)
 * - Ensures required collections exist
 * - Adds lightweight JSON-schema validation
 * - Adds basic indexes (unique email, userId lookups, etc.)
 */

async function ensureCollections(db) {
  if (!db) {
    console.warn("[schema] No database provided to ensureCollections");
    return;
  }

  const collConfigs = [
    {
      name: "users",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "createdAt"],
            properties: {
              name: { bsonType: "string" },
              email: { bsonType: "string" },
              phone: { bsonType: "string" },
              class_status: { bsonType: "string" },
              password: { bsonType: "string" },
              role: { bsonType: "string" },
              otp: { bsonType: "string" },
              verified: { bsonType: "bool" },
              profile: { bsonType: "object" }, // Allow any object structure
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { email: 1 }, options: { unique: true, name: "email_unique" } },
      ],
    },
    {
      name: "chats",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "messages", "createdAt"],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              messages: { bsonType: "array" },
              createdAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [{ key: { userId: 1 }, options: { name: "chats_userId_idx" } }],
    },
    {
      name: "sessions",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "expiresAt", "createdAt"],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              token: { bsonType: "string" },
              expiresAt: { bsonType: "date" },
              createdAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { token: 1 }, options: { unique: true, name: "token_unique" } },
      ],
    },
    {
      name: "tests",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "section", "createdAt"],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              section: { bsonType: "string" }, // e.g., 'riasec', 'intelligence', 'emotional'
              type: { bsonType: "string" },
              answers: { bsonType: "array" },
              score: { bsonType: ["int", "double", "string"] },
              completed: { bsonType: "bool" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { userId: 1 }, options: { name: "tests_userId_idx" } },
        { key: { section: 1 }, options: { name: "tests_section_idx" } },
      ],
    },
    {
      name: "counselingRequests",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: [
              "userId",
              "userName",
              "userEmail",
              "requestedAt",
              "status",
            ],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              userName: { bsonType: "string" },
              userEmail: { bsonType: "string" },
              requestedAt: { bsonType: ["date", "string"] },
              status: {
                enum: ["pending", "contacted", "scheduled", "completed"],
              },
              notes: { bsonType: "string" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { userId: 1 }, options: { name: "counsel_userId_idx" } },
        { key: { userEmail: 1 }, options: { name: "counsel_userEmail_idx" } },
      ],
    },
    {
      name: "portfolios",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "createdAt"],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              report: { bsonType: "object" },
              personalInfo: { bsonType: "object" },
              careerSuggestion: { bsonType: "object" },
              testResults: { bsonType: "array" },
              examScores: { bsonType: "array" },
              skills: { bsonType: "array" },
              projects: { bsonType: "array" },
              colleges: { bsonType: "array" },
              scholarships: { bsonType: "array" },
              generatedAt: { bsonType: ["date", "string"] },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { userId: 1 }, options: { name: "portfolio_userId_idx" } },
      ],
    },
    {
      name: "examResults",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["examName", "score", "maxScore", "createdAt"],
            properties: {
              userId: { bsonType: ["objectId", "string"] },
              examName: { bsonType: "string" },
              displayName: { bsonType: "string" },
              score: { bsonType: ["int", "double"] },
              maxScore: { bsonType: ["int", "double"] },
              category: { bsonType: "string" },
              shortCode: { bsonType: "string" },
              normalized: { bsonType: ["int", "double"] },
              normalizedScore: { bsonType: ["int", "double"] },
              mode: { bsonType: "string" }, // "ABSOLUTE" or "NORMALIZED"
              config: { bsonType: "object" },
              metadata: { bsonType: "object" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        { key: { userId: 1 }, options: { name: "examResults_userId_idx" } },
        { key: { examName: 1 }, options: { name: "examResults_examName_idx" } },
        {
          key: { userId: 1, examName: 1 },
          options: { name: "examResults_composite_idx" },
        },
        {
          key: { createdAt: -1 },
          options: { name: "examResults_createdAt_idx" },
        },
      ],
    },
    {
      name: "otpStore",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["phone", "hashedOtp", "expiresAt", "createdAt"],
            properties: {
              phone: { bsonType: "string" }, // E.164 format: +91XXXXXXXXXX
              hashedOtp: { bsonType: "string" }, // HMAC-SHA256 hash
              expiresAt: { bsonType: "date" }, // OTP expiry timestamp
              attempts: { bsonType: "int" }, // Number of verification attempts
              consumed: { bsonType: "bool" }, // Whether OTP has been used
              consumedAt: { bsonType: "date" }, // When OTP was consumed
              deliveryStatus: { enum: ["pending", "delivered", "failed"] },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        // Single index on phone for quick lookups
        { key: { phone: 1 }, options: { name: "otpStore_phone_idx" } },
        // Composite index for phone + creation time (find latest OTP)
        {
          key: { phone: 1, createdAt: -1 },
          options: { name: "otpStore_phone_createdAt_idx" },
        },
        // Index on expiry for TTL cleanup of consumed OTPs
        {
          key: { expiresAt: 1 },
          options: {
            name: "otpStore_expiresAt_ttl_idx",
            expireAfterSeconds: 0, // Delete immediately when expireAt is reached
            partialFilterExpression: { consumed: true }, // Only for consumed OTPs
          },
        },
        // Index on consumed for queries
        { key: { consumed: 1 }, options: { name: "otpStore_consumed_idx" } },
      ],
    },
    {
      name: "otpLogs",
      options: {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["eventType", "phone", "status", "timestamp"],
            properties: {
              eventType: {
                enum: [
                  "OTP_SEND_SUCCESS",
                  "OTP_SEND_FAILED",
                  "OTP_SEND_ERROR",
                  "OTP_VERIFY_SUCCESS",
                  "OTP_VERIFY_FAILED",
                  "OTP_VERIFY_ERROR",
                ],
              },
              phone: { bsonType: "string" }, // E.164 format
              status: { bsonType: "string" }, // success, failure, error, etc.
              details: { bsonType: "object" }, // Additional metadata
              timestamp: { bsonType: "date" },
              userAgent: { bsonType: ["string", "null"] },
            },
          },
        },
        validationLevel: "moderate",
      },
      indexes: [
        // Index for phone-based queries
        { key: { phone: 1 }, options: { name: "otpLogs_phone_idx" } },
        // Index for event type
        {
          key: { eventType: 1 },
          options: { name: "otpLogs_eventType_idx" },
        },
        // Composite index for phone + timestamp
        {
          key: { phone: 1, timestamp: -1 },
          options: { name: "otpLogs_phone_timestamp_idx" },
        },
        // TTL index - auto-delete logs older than 30 days
        {
          key: { timestamp: 1 },
          options: {
            name: "otpLogs_ttl_idx",
            expireAfterSeconds: 2592000, // 30 days
          },
        },
      ],
    },
  ];

  for (const cfg of collConfigs) {
    try {
      const existsCursor = db.listCollections({ name: cfg.name });
      const exists = await existsCursor.hasNext();
      if (!exists) {
        await db.createCollection(cfg.name, cfg.options);
        console.log(`[DB] Created missing collection: ${cfg.name}`);
      } else {
        // Optionally update validation rules in-place (safe attempt)
        try {
          await db.command({
            collMod: cfg.name,
            validator: cfg.options.validator,
            validationLevel: cfg.options.validationLevel || "moderate",
          });
          console.log(`[DB] Ensured validation for collection: ${cfg.name}`);
        } catch (modErr) {
          // collMod might fail on some hosting environments; safe to ignore
          console.debug(`[DB] collMod for ${cfg.name}:`, modErr.message);
        }
      }

      // Create indexes if provided
      if (Array.isArray(cfg.indexes) && cfg.indexes.length) {
        const coll = db.collection(cfg.name);
        for (const ix of cfg.indexes) {
          try {
            await coll.createIndex(ix.key, ix.options || {});
          } catch (ixErr) {
            console.warn(
              `[DB] Failed creating index on ${cfg.name}:`,
              ixErr.message
            );
          }
        }
      }
    } catch (err) {
      console.error(`[DB] Error ensuring collection ${cfg.name}:`, err.message);
    }
  }

  console.log("[DB] All required collections ensured");
}

module.exports = { ensureCollections };

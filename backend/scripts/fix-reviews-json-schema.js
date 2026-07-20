const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Kết nối database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eco-trade', {})
  .then(async () => {
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;
    const collectionName = 'reviews';

    try {
      // Xem schema hiện tại (nếu có)
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length > 0) {
        const currentSchema = collections[0].options?.validator?.$jsonSchema;
        console.log('Current JSON schema validator:', JSON.stringify(currentSchema, null, 2));
      }

      // Cập nhật schema để cho phép reviewUserId là null và reviewType có "product"
      await db.command({
        collMod: collectionName,
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["reviewerId", "postId", "reviewType", "rating"],
            properties: {
              reviewerId: {
                bsonType: "objectId",
                description: "ID of the user who wrote the review (required)"
              },
              reviewUserId: {
                anyOf: [
                  { bsonType: "objectId", description: "ID of the user being reviewed (optional)" },
                  { bsonType: "null", description: "No user being reviewed (for product-only reviews)" }
                ]
              },
              postId: {
                bsonType: "objectId",
                description: "ID of the product post (required)"
              },
              orderId: {
                anyOf: [
                  { bsonType: "objectId" },
                  { bsonType: "null" }
                ],
                description: "ID of the order (optional)"
              },
              rentalContractId: {
                anyOf: [
                  { bsonType: "objectId" },
                  { bsonType: "null" }
                ],
                description: "ID of the rental contract (optional)"
              },
              reviewType: {
                enum: ["seller", "buyer", "renter", "owner", "product"],
                description: "Type of the review (required)"
              },
              rating: {
                bsonType: "int",
                minimum: 1,
                maximum: 5,
                description: "Rating from 1 to 5 (required)"
              },
              comment: {
                anyOf: [
                  { bsonType: "string" },
                  { bsonType: "null" }
                ],
                description: "Optional comment"
              },
              isHidden: {
                bsonType: "bool",
                description: "Whether the review is hidden"
              }
            },
            additionalProperties: true
          }
        },
        validationLevel: "strict",
        validationAction: "error"
      });

      console.log('✅ Updated JSON schema validator on reviews collection successfully!');
    } catch (err) {
      console.error('❌ Error updating collection:', err);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('❌ Error connecting to MongoDB:', err);
    process.exit(1);
  });

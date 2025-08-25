// MongoDB initialization script
db = db.getSiblingDB('CardCataloger');

// Create collections with proper indexes
db.createCollection('cards');
db.createCollection('processingjobs');

// Create indexes for better performance
db.cards.createIndex({ "name": 1 });
db.cards.createIndex({ "manufacturer": 1 });
db.cards.createIndex({ "year": 1 });
db.cards.createIndex({ "sport": 1 });
db.cards.createIndex({ "createdAt": -1 });
db.cards.createIndex({ "lotNumber": 1, "iteration": 1 });

db.processingjobs.createIndex({ "status": 1 });
db.processingjobs.createIndex({ "createdAt": -1 });

print('Database initialized successfully');
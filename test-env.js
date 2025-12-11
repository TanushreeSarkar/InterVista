require('dotenv').config();

console.log("PORT =", process.env.PORT);
console.log("NODE_ENV =", process.env.NODE_ENV);
console.log("FIREBASE_PROJECT_ID =", process.env.FIREBASE_PROJECT_ID);
console.log("JWT_SECRET length =", (process.env.JWT_SECRET || '').length);
console.log("STT_MODE =", process.env.STT_MODE);
console.log("LLM_PROVIDER =", process.env.LLM_PROVIDER);

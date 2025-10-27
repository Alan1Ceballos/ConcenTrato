import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Falta MONGO_URI en .env");
  }
  // Fuerza el uso de la base 'concentrato' aunque el URI no la traiga en la ruta
  await mongoose.connect(uri, {
    dbName: "concentrato",
  });
  console.log("📦 Conectado a MongoDB (db: concentrato)");
}

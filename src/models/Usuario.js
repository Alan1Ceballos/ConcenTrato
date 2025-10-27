import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    hash: { type: String, required: true },
    avatarUrl: String
  },
  { timestamps: true }
);

export default mongoose.model("Usuario", UsuarioSchema);

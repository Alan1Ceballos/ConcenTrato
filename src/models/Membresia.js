import mongoose from "mongoose";

const MembresiaSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Types.ObjectId, ref: "Usuario", index: true, required: true },
    grupo: { type: mongoose.Types.ObjectId, ref: "Grupo", index: true, required: true },
    puntos: { type: Number, default: 0 },
    rol: { type: String, enum: ["admin", "miembro"], default: "miembro" }
  },
  { timestamps: true }
);

// Índice único compuesto (usuario-grupo)
MembresiaSchema.index({ usuario: 1, grupo: 1 }, { unique: true });

export default mongoose.model("Membresia", MembresiaSchema);

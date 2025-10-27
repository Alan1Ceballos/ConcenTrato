import mongoose from "mongoose";

const SesionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Types.ObjectId, ref: "Usuario", index: true, required: true },
    grupo: { type: mongoose.Types.ObjectId, ref: "Grupo", index: true, required: true },
    estado: { type: String, enum: ["iniciada", "finalizada", "cancelada"], default: "iniciada" },
    minutosObjetivo: { type: Number, default: 50 },
    inicio: { type: Date, default: () => new Date() },
    fin: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Sesion", SesionSchema);

import mongoose from "mongoose";

const ViolacionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Types.ObjectId, ref: "Usuario", index: true, required: true },
    grupo: { type: mongoose.Types.ObjectId, ref: "Grupo", index: true, required: true },
    origen: { type: String, enum: ["extension", "mobile", "manual", "socket", "logout"], default: "extension" },
    tipo: { type: String, enum: ["general", "abandono"], default: "general" },
    detalle: { type: String, default: "" },
    puntosAplicados: { type: Number, default: -100 },
    imagen: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Violacion", ViolacionSchema);

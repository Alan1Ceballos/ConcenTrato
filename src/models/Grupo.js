import mongoose from "mongoose";

const GrupoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    codigoInvitacion: { type: String, index: true },
    creador: { type: mongoose.Types.ObjectId, ref: "Usuario", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Grupo", GrupoSchema);

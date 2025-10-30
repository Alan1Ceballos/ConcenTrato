import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
  usuario: { type: mongoose.Types.ObjectId, ref: "Usuario", required: true },
  joinedAt: { type: Date, default: () => new Date() },
  leftAt: { type: Date, default: null }
}, { _id: false });

const GroupFocusSchema = new mongoose.Schema({
  
  grupo: { type: mongoose.Types.ObjectId, ref: "Grupo", index: true, required: true },
  estado: { type: String, enum: ["activa", "finalizada"], default: "activa", index: true },
  minutosObjetivo: { type: Number, default: 50 },
  inicio: { type: Date, default: () => new Date() },
  fin: { type: Date },

  acuerdos: {
    recompensa: { type: String, default: "" },
    castigo: { type: String, default: "" }
  },

  participantes: [ParticipantSchema]
}, { timestamps: true });

// índice compuesto para consultar rápido “¿hay activa?”
GroupFocusSchema.index({ grupo: 1, estado: 1 });

export default mongoose.model("GroupFocus", GroupFocusSchema);

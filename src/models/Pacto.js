import mongoose from "mongoose";

const PactoSchema = new mongoose.Schema(
  {
    grupo: { type: mongoose.Types.ObjectId, ref: "Grupo", index: true, required: true },
    limiteMinutosRedesDia: { type: Number, default: 60 },
    duracionDias: { type: Number, default: 7 },
    castigos: [String],
    recompensas: [String],
    reglasPuntos: {
      violacion: { type: Number, default: -100 },
      completarSesion: { type: Number, default: 20 }
    },
    activo: { type: Boolean, default: true },
    fechaInicio: { type: Date, default: () => new Date() },
    fechaFin: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Pacto", PactoSchema);

import Pacto from "../models/Pacto.js";

export async function crearPacto(req, res) {
  try {
    const { grupo, limiteMinutosRedesDia, duracionDias, castigos = [], recompensas = [], reglasPuntos } = req.body;

    if (!grupo) return res.status(400).json({ message: "Falta grupo" });

    // desactivar pactos activos previos
    await Pacto.updateMany({ grupo, activo: true }, { $set: { activo: false } });

    const pact = await Pacto.create({
      grupo,
      limiteMinutosRedesDia,
      duracionDias,
      castigos,
      recompensas,
      reglasPuntos,
      activo: true,
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + (duracionDias || 7) * 24 * 60 * 60 * 1000)
    });

    res.status(201).json(pact);
  } catch (err) {
    res.status(500).json({ message: "Error al crear pacto", error: err.message });
  }
}

export async function verPacto(req, res) {
  try {
    const { grupoId } = req.params;
    const pact = await Pacto.findOne({ grupo: grupoId, activo: true }).lean();
    if (!pact) return res.status(404).json({ message: "No hay pacto activo" });
    res.json(pact);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener pacto", error: err.message });
  }
}

export async function actualizarPacto(req, res) {
  try {
    const { id } = req.params;
    const pact = await Pacto.findByIdAndUpdate(id, req.body, { new: true });
    if (!pact) return res.status(404).json({ message: "Pacto no encontrado" });
    res.json(pact);
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar pacto", error: err.message });
  }
}

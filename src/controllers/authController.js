import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan campos" });
    }
    const exists = await Usuario.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email ya registrado" });

    const hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ nombre, email, hash });

    const token = jwt.sign({ id: user._id, nombre: user.nombre, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, nombre: user.nombre, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Error al registrar", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.hash);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user._id, nombre: user.nombre, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, nombre: user.nombre, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Error al iniciar sesión", error: err.message });
  }
}

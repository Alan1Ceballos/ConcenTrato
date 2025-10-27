import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, loading } = useContext(AuthContext);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const res = await register(nombre, email, password);
    if (!res.ok) setMsg(res.message || "Error");
  };

  return (
    <div className="container center" style={{minHeight:"80vh"}}>
      <div className="card" style={{width:420}}>
        <h2 style={{marginTop:0}}>Crear cuenta</h2>
        <p style={{color:"#93a1b1"}}>Sumate a tu grupo y concentrá mejor 💪</p>

        {msg && <div style={{color:"#f87171", marginBottom:12}}>{msg}</div>}

        <form onSubmit={onSubmit} className="row" style={{flexDirection:"column"}}>
          <label className="label">Nombre</label>
          <input className="input" value={nombre} onChange={e=>setNombre(e.target.value)} required />

          <label className="label" style={{marginTop:12}}>Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

          <label className="label" style={{marginTop:12}}>Contraseña</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

          <button className="btn" type="submit" disabled={loading} style={{marginTop:16}}>
            {loading ? "Creando..." : "Registrarme"}
          </button>
        </form>

        <hr className="sep" />
        <div style={{fontSize:14}}>
          ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
        </div>
      </div>
    </div>
  );
}

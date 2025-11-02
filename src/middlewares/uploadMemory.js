import multer from "multer";

// configura multer para almacenar archivos solo en memoria (no en disco)
const storage = multer.memoryStorage();

export const uploadMemory = multer({ storage });

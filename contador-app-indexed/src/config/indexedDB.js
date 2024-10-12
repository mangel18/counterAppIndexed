// indexedDB.js
import { openDB } from 'idb';

const dbPromise = openDB('ContadorDB', 1, {
  upgrade(db) {
    db.createObjectStore('registros', { keyPath: 'id', autoIncrement: true });
  },
});

export const addRecord = async (record) => {
  const db = await dbPromise;
  await db.add('registros', record);
};

export const getRecords = async () => {
  const db = await dbPromise;
  return await db.getAll('registros');
};

export const updateRecord = async (id, newDifference) => {
  const db = await dbPromise;

  // Obtener el registro existente antes de actualizarlo
  const existingRecord = await db.get('registros', id);

  // Asegúrate de mantener los campos anteriores y actualizar solo el campo "diferencia"
  const updatedRecord = { ...existingRecord, diferencia: newDifference };

  // Actualiza el registro en la base de datos
  await db.put('registros', updatedRecord);
};

export const deleteRecord = async (id) => {
  const db = await dbPromise;
  await db.delete('registros', id);
};

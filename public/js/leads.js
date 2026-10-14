// Guarda un lead web en Firestore (solo creación; las reglas validan campos y consentimiento).
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyArXy47I3PF38TZG5K8GHNT_NHOJL_UbhY",
    authDomain: "jimenez-asociados-portal.firebaseapp.com",
    projectId: "jimenez-asociados-portal",
    storageBucket: "jimenez-asociados-portal.firebasestorage.app",
    messagingSenderId: "588021927873",
    appId: "1:588021927873:web:bb0b494c51e6d0a4e76940"
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export const TEXTO_CONSENTIMIENTO = "Acepto la Política de Privacidad y autorizo a Jiménez & Asociados a tratar mis datos para responder mi solicitud.";

export async function guardarLead({ origen, nombre, telefono, email, datos }) {
    const doc = {
        origen,
        consentimiento: true,
        consentimientoTexto: TEXTO_CONSENTIMIENTO,
        pagina: location.pathname.substring(0, 100),
        createdAt: serverTimestamp()
    };
    if (nombre) doc.nombre = String(nombre).trim().substring(0, 80);
    if (telefono) doc.telefono = String(telefono).trim().substring(0, 20);
    if (email) doc.email = String(email).trim().toLowerCase().substring(0, 120);
    if (datos) {
        const limpio = {};
        Object.entries(datos).slice(0, 20).forEach(([k, v]) => { limpio[String(k).substring(0, 40)] = String(v ?? '').substring(0, 200); });
        doc.datos = limpio;
    }
    return addDoc(collection(db, 'artifacts', 'jimenez-portal-oficial', 'leads_web'), doc);
}
window.guardarLead = guardarLead;

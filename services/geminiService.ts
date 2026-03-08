import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

/**
 * Servicio central para el pre-procesamiento de Consultas Técnicas.
 * Utiliza el SDK @google/genai actualizado.
 */
export const procesarConsultaIA = async (
  estudioId: string, 
  casoId: string, 
  descripcionUsuario: string, 
  fotosUrls: string[], 
  audioTranscripcion: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Definición detallada del rol y contexto para Gemini
    const systemInstruction = `
    ROL Y CONTEXTO: Actuás como un Asistente Técnico Senior especializado en patologías edilicias para el estudio "De La Matriz Arquitectos". Tu función es realizar un pre-procesamiento de las "Consultas" enviadas por los usuarios (texto, fotos y audios).
    OBJETIVO TÉCNICO: Debes transformar datos no estructurados en un insumo técnico organizado. Este borrador será revisado y validado por un arquitecto humano antes de ser enviado al usuario.
    
    CATEGORÍAS DE DETECCIÓN (OBLIGATORIO CLASIFICAR EN UNA):
    1. Humedades: Capilaridad, filtración o condensación.
    2. Fallas Estructurales: Fisuras, asentamientos o corrosión de armaduras.
    3. Acabados y Revestimientos: Eflorescencias (salitre) o descascaramientos.
    4. Deterioros Externos: Raíces de árboles, vibraciones por obras linderas o impactos.
    5. CASO ESPECIAL Y OTRAS CONSULTAS: Problemas de medianería, vicios ocultos, orientación técnica administrativa o legal, y cualquier consulta que no encaje en las anteriores.
    
    REGLAS DE NEGOCIO Y SEGURIDAD:
    - NO emitas diagnósticos definitivos. Usa lenguaje condicional y orientativo.
    - El flag técnico 'validado_por_arquitecto' siempre debe ser FALSE en tu respuesta.
    - ACLARACIÓN OBLIGATORIA (Incluir en advertencias_tecnicas): "Este es un borrador preliminar generado por IA y debe ser validado por un profesional".
    
    FORMATO DE SALIDA: JSON estructurado.
    TONO: Culto, inspirador, analítico y extremadamente detallista.
    `;

    const promptInput = `
    Analiza la siguiente consulta técnica:
    Descripción del usuario: ${descripcionUsuario}
    Transcripción de audio: ${audioTranscripcion}
    Evidencia fotográfica (URLs): ${fotosUrls.join(", ")}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptInput,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tipo_patologia_detectada: { type: Type.STRING },
              diagnostico_probable: { type: Type.STRING },
              causas_posibles: { type: Type.STRING },
              nivel_urgencia: { type: Type.STRING, description: "Bajo / Medio / Alto" },
              que_no_hacer: { type: Type.ARRAY, items: { type: Type.STRING } },
              materiales_sugeridos: { type: Type.ARRAY, items: { type: Type.STRING } },
              advertencias_tecnicas: { type: Type.STRING },
              validado_por_arquitecto: { type: Type.BOOLEAN }
            },
            required: [
              "tipo_patologia_detectada", 
              "diagnostico_probable", 
              "causas_posibles", 
              "nivel_urgencia", 
              "que_no_hacer",
              "materiales_sugeridos",
              "advertencias_tecnicas",
              "validado_por_arquitecto"
            ]
          }
        }
      });

    // Extracción de la respuesta en texto usando la propiedad .text del SDK
    const jsonResponse = JSON.parse(response.text);

    // Mapeo a Firestore actualizando el estado del caso para el arquitecto
    const etapaRef = doc(db, "Estudios", estudioId, "Casos", casoId, "Etapas", "Consulta_Online");

    await updateDoc(etapaRef, {
      "Informe_Final": {
        ...jsonResponse,
        "validado_por_arquitecto": false,
        "fecha_pre_procesamiento": new Date().toISOString()
      },
      "Estado_Etapa": "EN_ANALISIS"
    });

    return { success: true, message: "Borrador de orientación técnica generado." };

  } catch (error) {
    console.error("Error en geminiService:", error);
    throw new Error("Error procesando la consulta técnica.");
  }
};

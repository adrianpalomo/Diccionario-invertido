import OpenAI from "openai";

export async function POST({ request }) {
  try {
    // Extrae el cuerpo de la petición
    const { query } = await request.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó la consulta" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const client = new OpenAI({
      apiKey: import.meta.env.OPENAI_API_KEY,
    });

    const instructions = `
Eres un experto en castellano. Revisa la siguiente consulta y determina si es válida para buscar definiciones. La consulta se considerará válida si contiene una descripción que requiera definir un concepto, excluyendo comentarios racistas, sexistas, etc. La respuesta puede ser una palabra simple (para buscar en el diccionario), una expresión compuesta (máquina de Turing, patas de gallo, etc.), una expresión corta que no se encuentre en el diccionario (llover a cántaros, Quid pro quo, etc.) o un refrán o dicho popular (mejor pájaro en mano que ciento volando, etc.).
La cantidad de respuestas debe estar entre 2 y 5, por ejemplo puede haber 2 palabras simples y 3 expresiones compuestas. A más especifica sea la consulta, menos respuestas pero concretas debes dar, si es una consulta genérica, puedes dar más respuestas.
La prioridad es importante, por lo tanto ordena las palabras o expresiones de mayor a menor prioridad.
Si la consulta es válida, responde con un JSON que contenga:
"valid": true,
"expression": un objeto con "keyword", "definition", "isSimple", "type", si la respuesta es una palabra simple (para buscar en la RAE) "isSimple" será true, pero si es una una expresión (más de una palabra), "isSimple" será false y "definition" será la definición o explicación de dicha expresión, que al menos tenga 20-25 palabras. "type" será null si es una palabra simple, "Locución" si es una expresión compuesta, "Expresión" si es una expresión corta o "Refrán" si es un refrán o dicho popular.
Si la consulta no es válida, responde con un JSON que contenga:
"valid": false,
"reason": una cadena breve que explique por qué la consulta es inválida.
`;

    // Llamada a la IA con el prompt combinado.
    const response = await client.responses.create({
      model: "gpt-4o",
      temperature: 0.5,
      instructions: instructions,
      input: query,
      text: {
        format: {
          type: "json_schema",
          name: "combined_result",
          schema: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              invalid_reason: { type: "string" },
              expression: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    keyword: { type: "string" },
                    definition: { type: "string" },
                    isSimple: { type: "boolean" },
                    type: { type: "string" }
                  },
                  required: ["keyword", "definition", "isSimple", "type"],
                  additionalProperties: false,
                },
              }
            },
            required: ["valid", "invalid_reason", "expression"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    console.log({ response });
    // Extraer el contenido de la respuesta.
    const message = response.output_text;
    let result;
    try {
      result = typeof message === "string" ? JSON.parse(message) : message;
    } catch (error) {
      result = { result: message };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

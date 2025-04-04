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

    // Prompt combinado para validar la consulta y generar definiciones.
    const instructions = `
Eres un experto en castellano. Revisa la siguiente consulta y determina si es válida para buscar definiciones de una palabra. La consulta se considerará válida si contiene una descripción que requiera definir un concepto y no es simplemente una palabra ya definida o un texto sin sentido. Si la consulta es válida, responde con un JSON que contenga: "valid": true, "words": un array de hasta tres palabras simples (cada una de una sola palabra, válidas en el diccionario) que se ajusten a la descripción, sin repetir palabras ya presentes en la consulta. Si la consulta no es válida, responde con un JSON que contenga: "valid": false, "reason": una cadena que explique por qué la consulta es inválida.`;

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
              reason: { type: "string" },
              words: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["valid", "words", "reason"],
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
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

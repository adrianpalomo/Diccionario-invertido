import OpenAI from "openai";

export async function POST({ params, request }) {
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

    // Llama a la API de OpenAI usando el prompt adecuado
    const response = await client.responses.create({
      model: "gpt-4o", // Asegúrate de que este modelo es correcto o usa otro modelo, por ejemplo "gpt-3.5-turbo"
      input: [
        {
          role: "developer",
          content:
            "Eres un experto en castellano. Dada una definición, responde con hasta tres palabras simples (cada una de una sola palabra, válidas en el diccionario). Ej: 'recipiente para líquidos' → vaso, taza, botella.",
        },
        {
          role: "user",
          content: query,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "definition_list",
          schema: {
            type: "object",
            properties: {
              words: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["words"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    console.log({ response });

    // Extrae el contenido de la respuesta
    const message = response.output_text;

    // Devuelve el resultado (si la respuesta ya es JSON, o conviértelo si es una cadena)
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

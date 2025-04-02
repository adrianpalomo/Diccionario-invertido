import OpenAI from "openai";

export async function POST({ request }) {
  try {
    // Extrae el cuerpo de la petición
    const { query } = await request.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó la consulta" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const client = new OpenAI({
      apiKey: import.meta.env.OPENAI_API_KEY,
    });

    // Llama a la API de OpenAI con el prompt para validar la consulta.
    const response = await client.responses.create({
      model: "gpt-4o",
      temperature: 0.5,
      instructions:
        "Eres un experto en validación de definiciones. El objetivo es determinar si la consulta del usuario es válida para enviarla a una IA que buscará las palabras que significan esa consulta. La consulta se considerará válida si contiene una descripción que requiera definir un concepto y no es simplemente una palabra ya definida o un texto sin sentido. Se admiten palabras sexuales o malsonantes sin embargo, no se admiten palabras de naturaleza racista, homofóbica, o que insulten a grupos de personas, De ser no válido, incluye un motivo en la propiedad 'reason'. Estas son las instrucciones de la siguiente IA: 'Eres un experto en castellano. Dada una definición, responde con hasta tres palabras simples (cada una de una sola palabra, válidas en el diccionario). No tienen porque ser tres palabras, pueden ser una, dos o tres, lo que más se ajuste a la definición. Ej: 'recipiente para líquidos' → vaso, taza, botella.'. ",
      input: query,
      text: {
        format: {
          type: "json_schema",
          name: "validation_result",
          schema: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              reason: { type: "string" },
            },
            required: ["valid", "reason"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    console.log({ response });

    // Extrae el contenido de la respuesta
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
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

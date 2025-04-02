import { RAE } from "rae-api";

// Función auxiliar para reintentar una operación hasta 3 veces en total.
async function retryOperation<T>(
  operation: () => Promise<T>,
  attempts = 2,
): Promise<T> {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    console.log("Attempt", i + 1);
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST({ request }) {
  try {
    const { word } = await request.json();
    if (!word) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó la palabra" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Intentamos obtener las definiciones de la palabra (hasta 3 veces).
    let result;
    try {
      const rae = new RAE();
      const searchResult = await retryOperation(() => rae.searchWord(word));

      if (!searchResult.results || searchResult.results.length === 0) {
        return new Response(
          JSON.stringify({
            word,
            definitions: [
              "Esta palabra es válida pero no se encuentra en el diccionario de la Real Academia Española.",
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const wordId = searchResult.results[0].id;

      result = await rae.fetchWord(wordId);
    } catch (error) {
      // Si tras 3 intentos no se pueden obtener las definiciones, devolvemos un fallback.
      return new Response(
        JSON.stringify({
          word,
          definitions: [
            "No se han podido obtener las definiciones. Haz click sobre la palabra para ir a la definición en el diccionario de la RAE.",
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const definitions = result.definitions;
    // Mapear cada definición a una cadena.
    const defs = definitions.map((def) => def.content);

    return new Response(JSON.stringify({ word, definitions: defs }), {
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

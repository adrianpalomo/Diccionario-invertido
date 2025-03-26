import { RAE } from "rae-api";

export async function POST({ request }) {
  try {
    const { word } = await request.json();
    if (!word) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó la palabra" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const rae = new RAE(); // Puedes habilitar debug pasando true: new RAE(true)
    const searchResult = await rae.searchWord(word);

    if (!searchResult.getRes() || searchResult.getRes().length === 0) {
      return new Response(
        JSON.stringify({ error: `No se encontró la palabra "${word}"` }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const wordId = searchResult.getRes()[0].getId();
    const result = await rae.fetchWord(wordId);
    const definitions = result.getDefinitions();

    // Mapear cada definición a una cadena
    const defs = definitions.map((def) => def.getDefinition());

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

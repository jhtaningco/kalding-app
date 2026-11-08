import { NextResponse } from "next/server";
import { fetchWordDefinition } from "@/../scripts/import-word";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word || !word.trim()) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 });
  }

  const result = await fetchWordDefinition(word);
  if (!result) {
    return NextResponse.json(
      { error: `Could not find definition for "${word}"` },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}

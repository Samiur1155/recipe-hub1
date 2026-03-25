import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { dishName } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Write a recipe for ${dishName}. Return ONLY a valid JSON object with no markdown or code blocks.
Structure it EXACTLY like this:
{
  "recipe": "Full markdown formatted recipe with ingredients and steps",
  "nutrition": {
    "calories": "500 kcal",
    "protein": "25g",
    "fat": "20g",
    "carbs": "45g"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const parsedData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
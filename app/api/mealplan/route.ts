import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { dietType, mode, mealType, currentDish } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (mode === "swap") {
      prompt = `Suggest a single alternative ${mealType} dish to replace "${currentDish}" for a ${dietType} diet.
Return ONLY a valid JSON object with no markdown or code blocks.
Structure it EXACTLY like this:
{
  "newDish": "Recipe name and short description"
}`;
    } else {
      prompt = `Create a 7-day meal plan based on this preference: "${dietType}".
For each day provide breakfast, lunch, and dinner.
Return ONLY a valid JSON object with no markdown or code blocks.
Structure it EXACTLY like this:
{
  "plan": [
    {
      "day": "Day 1",
      "breakfast": "Recipe name and short description",
      "lunch": "Recipe name and short description",
      "dinner": "Recipe name and short description"
    }
  ]
}
Repeat for all 7 days.`;
    }

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const parsedData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Meal Plan Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
    try {
        const { message } = await request.json();
        const gemini_key = process.env.GEMINI_API_KEY2;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemini_key}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0]?.content?.parts[0]?.text || "";

        return Response.json({ response: generatedText });
    } catch (error) {
        console.error("Error:", error);
        return Response.json(
            { error: "Failed to process your request" },
            { status: 500 }
        );
    }
}
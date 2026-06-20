const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize the Google Gen AI client if an API key is provided
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

exports.parseTransaction = async (req, res) => {
    const { text, imageBase64 } = req.body; // Expects text string or base64 image string (data:image/jpeg;base64,...)

    try {
        if (!text && !imageBase64) {
            return res.status(400).json({ success: false, message: 'Provide either text or imageBase64' });
        }

        // If no API key is configured, fallback to a mock/regex parser so the demo doesn't crash
        if (!aiClient) {
            console.warn('GEMINI_API_KEY not found in .env. Using fallback parser.');
            const fallbackResult = {
                amount: 0,
                category: 'Miscellaneous',
                type: 'Expense',
                description: text || 'Parsed from Receipt'
            };

            if (text) {
                // simple regex to find amount
                const amtMatch = text.match(/\b\d+(\.\d{1,2})?\b/);
                if (amtMatch) fallbackResult.amount = parseFloat(amtMatch[0]);
                
                const lowerText = text.toLowerCase();
                if (lowerText.includes('salary') || lowerText.includes('credited')) fallbackResult.type = 'Income';
                if (lowerText.includes('food') || lowerText.includes('dinner')) fallbackResult.category = 'Food';
                else if (lowerText.includes('uber') || lowerText.includes('ola') || lowerText.includes('ride')) fallbackResult.category = 'Transport';
            } else if (imageBase64) {
                fallbackResult.amount = 450; // Mock value for image
                fallbackResult.category = 'Food';
            }

            return res.json({ success: true, data: fallbackResult });
        }

        // --- Use Gemini AI if API key is present ---
        const promptText = `
        You are an intelligent financial assistant for an expense tracker app called MyKharcho.
        Analyze the provided input (text or image) and extract the transaction details.
        Note that the user might use English or Hinglish (Hindi written in English alphabet).
        For example: "mile", "aaye", "credited", "received" -> Income.
        "diye", "kharch", "debited", "spent", "paid" -> Expense.

        Return ONLY a JSON object with exactly these fields:
        {
            "amount": number (the transaction amount, positive number),
            "category": string (best matching category: Food, Transport, Bills, Shopping, Salary, Entertainment, Health, Grocery, Miscellaneous),
            "type": string (either "Expense" or "Income"),
            "description": string (a short title or description of the transaction),
            "walletName": string (if the user mentions a bank, wallet, or payment method like UCO, Paytm, PhonePe, Cash, HDFC, gullak, etc. Otherwise leave empty string)
        }
        Do not return any markdown formatting, just the raw JSON object.
        `;

        let responseText = '';


        if (imageBase64) {
            // Remove data URL prefix if present (e.g. data:image/jpeg;base64,)
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
            
            const response = await aiClient.models.generateContent({
                model: 'gemini-flash-latest',
                contents: [
                    { role: 'user', parts: [
                        { text: promptText },
                        { inlineData: { data: base64Data, mimeType } }
                    ]}
                ]
            });
            responseText = response.text;
        } else {
            const response = await aiClient.models.generateContent({
                model: 'gemini-flash-latest',
                contents: promptText + "\nUser Input: " + text
            });
            responseText = response.text;
        }

        // Clean the response (sometimes models wrap in ```json ... ```)
        let cleanJsonStr = responseText.trim();
        if (cleanJsonStr.startsWith('```json')) cleanJsonStr = cleanJsonStr.substring(7);
        if (cleanJsonStr.startsWith('```')) cleanJsonStr = cleanJsonStr.substring(3);
        if (cleanJsonStr.endsWith('```')) cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
        
        const result = JSON.parse(cleanJsonStr.trim());
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('AI Parsing Error:', error);
        res.status(500).json({ success: false, message: 'Failed to parse transaction' });
    }
};

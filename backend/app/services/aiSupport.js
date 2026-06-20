const { GoogleGenerativeAI } = require("@google/generative-ai");

// You'll need to add GEMINI_API_KEY to your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.getAIResponse = async (subject, description) => {
    try {
        const prompt = `You are an AI support agent for "SPARK PRO", a financial expense tracking SaaS. 
        A user has raised a support ticket.
        Subject: ${subject}
        Description: ${description}
        
        Provide a helpful, professional, and concise response. 
        If it's a technical issue, tell them a human agent will check soon.
        If it's about how to use the app, give a short guide.
        Keep it under 100 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error('AI Support Error:', err);
        return "Thank you for reaching out. Our support team has been notified and will get back to you shortly.";
    }
};

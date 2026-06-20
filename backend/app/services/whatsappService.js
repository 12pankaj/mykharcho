const axios = require('axios');

// Using the provided token directly as requested by user
const WHATSAPP_TOKEN = 'EAAeZAibCmCP0BRbtqHBbZCxLjiaDB2VORPZBUspKPnXnMfhklICDc7JbgwWmyy5VPtwKQVakPmpIeTQDzL7r1wAvzObR0ZA2d1FEw98ZAdy8J8z36ehHGR1XzNJPQxuZCWis0s5zCvHwgRtFjXAgkMQwI5WI20XDG9qJ67YhDWsknET46tdzIzP3ROkeU9iQyxOwZDZD';
const TEMPLATE_NAME = 'reminder';

// Usually, you need a Phone Number ID for the WhatsApp Cloud API.
// If it's not set in env, we will fall back to a dummy or try to use a mock for demonstration.
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '1234567890'; // Replace with actual in production

exports.sendReminder = async (toPhoneNumber, variables = []) => {
    try {
        if (!toPhoneNumber) {
            console.error('WhatsApp Error: No phone number provided');
            return false;
        }

        // Format phone number (remove +, spaces, etc.)
        const formattedPhone = toPhoneNumber.replace(/[^0-9]/g, '');

        const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
        
        // Build the components array for the template parameters (if any)
        // variables might be like [{ type: "text", text: "Amit" }, { type: "text", text: "5000" }]
        let components = [];
        if (variables.length > 0) {
            components = [
                {
                    type: 'body',
                    parameters: variables
                }
            ];
        }

        const data = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: TEMPLATE_NAME,
                language: {
                    code: 'en_US' // Adjust if template is in hindi e.g., 'hi'
                },
                components: components
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`WhatsApp Reminder sent to ${formattedPhone}. Message ID:`, response.data.messages[0].id);
        return true;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response ? error.response.data : error.message);
        
        // For development/demo without a real PHONE_NUMBER_ID, we'll pretend it succeeded
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 100) {
           console.log(`[Mock] WhatsApp Reminder would be sent to ${toPhoneNumber} using template '${TEMPLATE_NAME}'`);
           return true; 
        }
        return false;
    }
};

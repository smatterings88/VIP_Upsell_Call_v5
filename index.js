import twilio from 'twilio';
import express from 'express';

// Validate environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'ULTRAVOX_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Ultravox configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;

function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // For US numbers (assuming US if no country code provided)
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    
    // If number already includes country code (11+ digits)
    if (digits.length >= 11) {
        return `+${digits}`;
    }
    
    return null;
}

async function createUltravoxCall(clientName) {
    const systemPrompt = `
Ultravox-Optimized VIP Upsell Script (v5.0 - Persona-Based Closer)

(Now with Privacy Check ✅ | Off-Topic Redirection 🔄 | Auto-Close on “Yes” ✅)

⸻

🎯 AGENT ROLE

You are Alex, Ken’s AI-powered digital event assistant.
You’re calling someone who registered for the upcoming event but hasn’t yet upgraded to VIP.
Your mission: Offer a one-time 25% VIP upgrade discount, valid for 30 minutes only.

Use NLP framing, insider language, emotional triggers, and elegant urgency.
Tone: Helpful, confident, professional with charm. Never pushy.

Also:
🛑 Don’t share details unless speaking directly with ${clientName}
🎯 If they go off-topic, politely bring it back
✅ If they say “yes,” stop selling and go straight to checkout flow

⸻

👋 GREETING + AVAILABILITY CHECK

“Hey there! May I speak with ${clientName}, please?”

If unavailable:
“No problem at all—I’ll reach out another time. This is a quick call meant just for them, so I’ll try again later. Thanks!”

If available: Proceed 👇

⸻

🔍 CURIOSITY OPENER

“This is Alex, Ken’s digital assistant.
Thanks again for registering for the event—I’m reaching out with something kind of exclusive.
Mind if I take a minute to share it with you?”

⸻

🔄 OFF-TOPIC REDIRECTION

If they bring up something unrelated:

“Totally get that—and happy to chat more another time. But just to keep this quick—I’m calling with a time-sensitive VIP opportunity for the event. Can I share it with you real quick?”

If yes, continue to 👇

⸻

🧠 PERSONA IDENTIFICATION PROMPT

“Quick question before we dive in—so I can make this as relevant as possible:
Which of these four categories would best describe you?
👉 Business owner or agency/consultant?
👉 Coach, healer, or service provider?
👉 Creator, freelancer, or solopreneur?
👉 Just getting started and figuring it all out?”

⸻

🎯 [A] BUSINESS OWNER / AGENCY / CONSULTANT

“Perfect. So if you’re running an agency or business, here’s why VIP’s such a smart move:

You get access to advanced sessions, exclusive Q and A with top-tier speakers, and full recordings—so you can feed everything into your AI tools and turn insights into systems and client-facing offers fast.
VIP is how you build once, reuse forever.”

Objection Boost:
“If you could walk away with 2–3 ready-to-use deliverables for your next client or campaign… would that be worth $375?”

⸻

🌿 [B] COACH / HEALER / SERVICE PROVIDER

“Love that. As a coach or healer, it’s not just about what you learn—it’s about how you integrate and connect.

VIP gives you access to smaller rooms, speaker conversations, and a concierge so you don’t get overwhelmed or lost in the crowd.
And with the recordings, you can pull insights for your clients exactly when they need them.”

Objection Boost:
“What would it be worth to leave this event feeling clear, confident, and connected—instead of confused or FOMO’d?”

⸻

🎨 [C] CREATOR / FREELANCER / SOLOPRENEUR

“Amazing. For solo creators and freelancers, the difference between GA and VIP is access.

In VIP, you’re in the room with decision-makers and collaborators, and you get recordings to turn each session into a post, pitch, or lead magnet.”

Objection Boost:
“You’re building this solo—but VIP puts you in rooms that feel like a team. Would that make a difference?”

⸻

🚀 [D] JUST GETTING STARTED

“Totally get it—starting out can be overwhelming.

VIP gives you a safety net: session recordings you can revisit at your own pace, access to expert Q&A so you don’t have to guess, and a concierge to help you take action.”

Objection Boost:
“If VIP gave you clarity on where to start—and the confidence to follow through—wouldn’t that make the whole event more powerful?”

⸻

⚡️ FLASH-SALE OFFER (ALL PERSONAS)

“We’re running a flash-sale test through automation, and you’re one of the few people getting the offer.

Since I’m reaching out as Ken’s AI assistant, you get early access to a 25% discount—good for the next 30 minutes only.

Here’s what that means:
	•	Platinum: $499 → $375
	•	Gold: $299 → $225
	•	Silver: $149 → $110

Clean pricing. No cents. No gimmicks. Just smart timing.
After this window, VIP returns to full price—or more once the event starts.”

⸻

💡 ADVANCED VIP HACK: OUR LITTLE SECRET

⚠️ Only use this section if they’re undecided.
If they’ve already said “I’m in” or “let’s do it” → skip this and go to ✅ IF INTERESTED

“Let me give you a little insider hack—something most VIPs don’t even leverage…

Once you have the session recordings, you can drop them into AI tools—like ChatGPT or Claude—and instantly generate:
	•	Custom action plans
	•	Launch strategies
	•	Personalized emails or sales copy

General admission doesn’t get this. Most VIPs don’t use it. But you will.
This is how you turn a one-time event into a repeatable business engine.”

⸻

⏳ TIME-BASED URGENCY PROMPTS
	•	After 2 minutes:
“Just keeping you in the loop—you’ve still got about 28 minutes to grab the flash pricing.”
	•	After 5 minutes:
“We’re around the 25-minute mark now. If you’re leaning yes, this is the time to jump.”
	•	After 10 minutes:
“Only 20 minutes left before the offer resets. Want me to lock it in while we’re talking?”

⸻

🙋‍♀️ UNIVERSAL OBJECTION HANDLING

🛑 Skip all of this if they say “yes.” Go straight to close.

	1.	“What’s actually included?”
“VIP includes private networking, concierge help, Q&A access, replays, and bonuses.
But the real edge? You’re in the room where momentum happens.”
	2.	“It’s the price…”
“Makes sense. But if what you gain from VIP is worth 3–5x the cost, would the price still be the issue—or is it about trusting it delivers?”
“What would help you feel totally confident it’s the right move?”
	3.	“I need to think about it…”
“Sure. Just to understand—are you weighing options, or unsure if it’s even worth upgrading?”
“Most people who say that are actually unsure it’s worth it. Is that you?”
	4.	“What’s the difference from GA?”
“GA gives you access. VIP gives you advantage.
You’ll leave with clarity, strategy, and relationships. It’s not just content—it’s conversion fuel.”
	5.	“I might not make all the sessions…”
“VIP gives you all the recordings—so even if you miss live sessions, you won’t miss a thing.
You can even run them through AI tools for custom strategies.”

⸻

✅ IF INTERESTED (AUTO-CLOSE)

🛑 Stop selling immediately once they say yes.
No more features. No more bonuses. No delay.

“Awesome—let’s lock in your VIP now while the offer’s still live…”

generateDiscount()
updateOrder()
Confirm, thank them, and wrap up:

“You’re all set! I’ll send confirmation to your email. Can’t wait to see what you get from the experience—talk soon!”

⸻

🕐 IF BUSY / NEEDS TO THINK

“Totally understand. If you’re genuinely interested, I can hold the discount and circle back later today.
What time works best for a quick follow-up?”

⸻

❌ IF NOT INTERESTED

“No worries—I just wanted to make sure you knew it was available.
Enjoy the event—you’re going to love it either way.”

⸻
`;
    
    const ULTRAVOX_CALL_CONFIG = {
        systemPrompt: systemPrompt,
        model: 'fixie-ai/ultravox',
        voice: 'Mark',
        temperature: 0.3,
        firstSpeaker: 'FIRST_SPEAKER_USER',
        medium: { "twilio": {} }
    };

    try {
        const response = await fetch('https://api.ultravox.ai/api/calls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ULTRAVOX_API_KEY
            },
            body: JSON.stringify(ULTRAVOX_CALL_CONFIG)
        });

        if (!response.ok) {
            throw new Error(`Ultravox API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating Ultravox call:', error);
        throw error;
    }
}

async function initiateCall(clientName, phoneNumber) {
    try {
        console.log(`Creating Ultravox call for ${clientName} at ${phoneNumber}...`);
        const { joinUrl } = await createUltravoxCall(clientName);
        console.log('Got joinUrl:', joinUrl);

        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        const call = await client.calls.create({
            twiml: `<Response><Connect><Stream url="${joinUrl}"/></Connect></Response>`,
            to: phoneNumber,
            from: TWILIO_PHONE_NUMBER
        });

        console.log('Call initiated:', call.sid);
        return call.sid;
    } catch (error) {
        console.error('Error initiating call:', error);
        throw error;
    }
}

const app = express();

// Add basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Parse JSON bodies
app.use(express.json());

// Handle both GET and POST requests
app.route('/initiate-call')
    .get(handleCall)
    .post(handleCall);

async function handleCall(req, res) {
    try {
        const clientName = req.query.clientName || req.body.clientName;
        const phoneNumber = req.query.phoneNumber || req.body.phoneNumber;
        
        if (!clientName || !phoneNumber) {
            return res.status(400).json({ 
                error: 'Missing required parameters: clientName and phoneNumber' 
            });
        }

        // Format and validate phone number
        const formattedNumber = formatPhoneNumber(phoneNumber);
        if (!formattedNumber) {
            return res.status(400).json({
                error: 'Invalid phone number format. Please provide a valid phone number (e.g., 1234567890 or +1234567890)'
            });
        }

        const callSid = await initiateCall(clientName, formattedNumber);
        res.json({ 
            success: true, 
            message: 'Call initiated successfully',
            callSid 
        });
    } catch (error) {
        console.error('Error in handleCall:', error);
        res.status(500).json({ 
            error: 'Failed to initiate call',
            message: error.message 
        });
    }
}

const PORT = process.env.PORT || 10000;

// Wrap server startup in a try-catch block
try {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}

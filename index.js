import twilio from 'twilio';
import https from 'https';
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

async function createUltravoxCall(clientName) {
    const systemPrompt = `
You are a helpful assistant.

Ultravox-Optimized VIP Upsell Script (v5.0 - Persona-Based Closer)

--------------------------------------------------------
AGENT ROLE

You are Alex, Ken's AI-powered digital event assistant.
You're calling someone who registered for the upcoming event but hasn't yet upgraded to VIP.
Your mission: Offer a one-time 25% VIP upgrade discount, valid for 30 minutes only.

Use NLP framing, insider language, emotional triggers, and elegant urgency.
Tone: Helpful, confident, professional with charm. Never pushy.

--------------------------------------------------------
GREETING 

"Hey there! May I speak with ${clientName}? 

--------------------------------------------------------
CURIOSITY OPENER

This is Alex, Ken's digital assistant.
Thanks again for registering for the event—I'm reaching out with something kind of exclusive.
Mind if I take a minute to share it with you?"

--------------------------------------------------------
PERSONA IDENTIFICATION PROMPT

"Quick question before we dive in—so I can make this as relevant as possible:
Would you say you're attending more as a...

👉 A: Business owner or agency/consultant?
👉 B: Coach, healer, or service provider?
👉 C: Creator, freelancer, or solopreneur?
👉 D: Just getting started and figuring it all out?"

Based on their response, use the corresponding variant below:

--------------------------------------------------------
[A] BUSINESS OWNER / AGENCY / CONSULTANT

"Perfect. So if you're running an agency or business, here's why VIP's such a smart move:

You get access to advanced sessions, exclusive Q and A with top-tier speakers, and full recordings—so you can feed everything into your AI tools and turn insights into systems and client-facing offers fast.

VIP is how you build once, reuse forever."

Objection Boost:
"If you could walk away with 2–3 ready-to-use deliverables for your next client or campaign… would that be worth $375?"

--------------------------------------------------------
[B] COACH / HEALER / SERVICE PROVIDER

"Love that. As a coach or healer, it's not just about what you learn—it's about how you integrate and connect.

VIP gives you access to smaller rooms, speaker conversations, and a concierge so you don't get overwhelmed or lost in the crowd.

Plus, with the recordings, you can revisit the sessions and pull out insights to use with your clients exactly when they need them."

Objection Boost:
"What would it be worth to leave this event feeling clear, confident, and connected—instead of confused or FOMO'd?"

--------------------------------------------------------
[C] CREATOR / FREELANCER / SOLOPRENEUR

"Amazing. For solo creators and freelancers, the difference between GA and VIP is access.

In VIP, you get in the room with decision-makers and collaborators, get your questions answered directly, and walk away with all the recordings so you can turn every session into a post, pitch, or lead magnet."

Objection Boost:
"You're building this solo—but VIP puts you in rooms that feel like a team. Would that make a difference?"

--------------------------------------------------------
[D] JUST GETTING STARTED

"Totally get it—starting out can be overwhelming.

VIP gives you a safety net: session recordings you can revisit at your own pace, access to expert Q and A so you don't have to guess, and a concierge to make sure you actually implement."

Objection Boost:
"If VIP gave you the exact clarity on where to start—and the confidence to actually follow through—wouldn't that make the entire event more powerful?"

--------------------------------------------------------
FLASH-SALE OFFER (ALL PERSONAS)

"We're running a flash-sale test through automation, and you're one of the few people getting the offer.

Since I'm reaching out as Ken's AI assistant, we're giving early access to a 25% discount, valid for the next 30 minutes only.

Here's what that means:
- Platinum drops from $499 to $375
- Gold drops from $299 to $225
- Silver drops from $149 to $110

Clean pricing. No cents. No gimmicks. Just smart timing.

After this window, VIP returns to full price—or more once the event starts."

--------------------------------------------------------
ADVANCED VIP HACK: OUR LITTLE SECRET

"Let me give you a little insider hack—something most VIPs don't even leverage…

Once you have the session recordings, you can drop them into AI tools—like ChatGPT or Claude—and instantly generate:
- Custom action plans
- Launch strategies
- Personalized emails or sales copy

General admission doesn't get this. Most VIPs don't use it. But you will.

This is how you turn a one-time event into a repeatable business engine."

--------------------------------------------------------
TIME-BASED URGENCY PROMPTS

- After 2 minutes:
  "Just keeping you in the loop—you've still got about 28 minutes to grab the flash pricing."

- After 5 minutes:
  "We're around the 25-minute mark now. If you're leaning yes, this is the time to jump."

- After 10 minutes:
  "Only 20 minutes left before the offer resets. Want me to lock it in while we're talking?"

--------------------------------------------------------
UNIVERSAL OBJECTION HANDLING

1. "What's actually included?"
"Totally fair. VIP includes private networking, concierge help, Q and A access, replays, and bonuses.
But the real edge? You're in the room where momentum happens."

2. "It's the price..."
"Makes sense. But if what you gain from VIP is worth 3–5x the cost, would the price still be the issue—or is it about trusting it delivers?"
"What would help you feel totally confident it's the right move?"

3. "I need to think about it..."
"Sure. Just to understand—are you weighing options, or unsure if it's even worth upgrading?"
"Most people who say that are actually unsure it's worth it. Is that you?"

4. "What's the difference from GA?"
"GA gives you access. VIP gives you advantage.
You'll leave with clarity, strategy, and relationships. It's not just content—it's conversion fuel."

5. "I might not make all the sessions..."
"Totally understand. VIP gives you all the recordings—so even if you miss live sessions, you won't miss a thing."
"And here's the bonus—you can run those through your AI and create customized tools and plans.
General admission? Doesn't have that. You do."

--------------------------------------------------------
IF INTERESTED

"Awesome—let's lock in your VIP now while the offer's still live…"

> generateDiscount()
> updateOrder()
> Confirm and thank them

--------------------------------------------------------
IF BUSY / NEEDS TO THINK

"Totally understand. If you're genuinely interested, I can hold the discount and circle back later today.
What time works best for a quick follow-up?"

--------------------------------------------------------
IF NOT INTERESTED

"No worries—I just wanted to make sure you knew it was available. Enjoy the event—you're going to love it either way."

--------------------------------------------------------
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

        // Validate phone number format
        if (!/^\+\d{10,15}$/.test(phoneNumber)) {
            return res.status(400).json({
                error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)'
            });
        }

        const callSid = await initiateCall(clientName, phoneNumber);
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

const PORT = process.env.PORT || 3000;

// Wrap server startup in a try-catch block
try {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}

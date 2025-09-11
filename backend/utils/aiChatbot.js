const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mental health safety prompts and guidelines
const SAFETY_PROMPTS = {
  crisis: [
    "I'm having thoughts of hurting myself",
    "I want to die",
    "I'm going to kill myself",
    "I can't go on anymore",
    "I want to end it all"
  ],
  escalation: [
    "I'm feeling very depressed",
    "I can't cope anymore",
    "I need help urgently",
    "I'm having panic attacks",
    "I can't sleep at all"
  ]
};

const SYSTEM_PROMPT = `You are AI Sathi, a compassionate mental health support assistant for students. Your role is to:

1. Provide psychological first-aid and emotional support
2. Offer evidence-based coping strategies and stress-relief techniques
3. Listen actively and respond with empathy
4. Escalate to human counsellors when necessary
5. Support students in multiple languages (English, Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Odia, Punjabi, Urdu)

IMPORTANT GUIDELINES:
- Always respond in the user's preferred language
- Be warm, non-judgmental, and supportive
- Never provide medical diagnosis or treatment
- For crisis situations, immediately suggest contacting emergency services
- Encourage professional help when appropriate
- Focus on immediate coping strategies and emotional support
- Keep responses concise but meaningful
- Use culturally appropriate examples and references

CRISIS RESPONSE: If user mentions self-harm, suicide, or severe mental health crisis, immediately:
1. Express concern and validation
2. Suggest contacting emergency services (108, 112, or local crisis helpline)
3. Provide immediate coping strategies
4. Escalate to human counsellor

Remember: You are a supportive friend, not a replacement for professional mental health care.`;

const generateResponse = async (message, context = {}, language = 'en') => {
  try {
    // Check for crisis indicators
    const isCrisis = SAFETY_PROMPTS.crisis.some(prompt => 
      message.toLowerCase().includes(prompt.toLowerCase())
    );
    
    const needsEscalation = SAFETY_PROMPTS.escalation.some(prompt => 
      message.toLowerCase().includes(prompt.toLowerCase())
    );

    let systemPrompt = SYSTEM_PROMPT;
    
    // Add context information
    if (context.currentMood) {
      systemPrompt += `\n\nUser's current mood: ${context.currentMood}`;
    }
    
    if (context.lastMoodLog) {
      systemPrompt += `\n\nUser's recent mood pattern: ${context.lastMoodLog}`;
    }

    // Add language-specific instructions
    const languageInstructions = {
      'hi': 'Respond in Hindi (हिंदी) with appropriate cultural context.',
      'ta': 'Respond in Tamil (தமிழ்) with appropriate cultural context.',
      'te': 'Respond in Telugu (తెలుగు) with appropriate cultural context.',
      'bn': 'Respond in Bengali (বাংলা) with appropriate cultural context.',
      'gu': 'Respond in Gujarati (ગુજરાતી) with appropriate cultural context.',
      'mr': 'Respond in Marathi (मराठी) with appropriate cultural context.',
      'kn': 'Respond in Kannada (ಕನ್ನಡ) with appropriate cultural context.',
      'ml': 'Respond in Malayalam (മലയാളം) with appropriate cultural context.',
      'or': 'Respond in Odia (ଓଡ଼ିଆ) with appropriate cultural context.',
      'pa': 'Respond in Punjabi (ਪੰਜਾਬੀ) with appropriate cultural context.',
      'ur': 'Respond in Urdu (اردو) with appropriate cultural context.'
    };

    if (languageInstructions[language]) {
      systemPrompt += `\n\n${languageInstructions[language]}`;
    }

    // Crisis response
    if (isCrisis) {
      systemPrompt += `\n\nCRISIS ALERT: User is expressing thoughts of self-harm or suicide. Provide immediate support and crisis resources.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0].message.content;

    // Determine escalation level
    let escalationLevel = 0;
    if (isCrisis) {
      escalationLevel = 3;
    } else if (needsEscalation) {
      escalationLevel = 2;
    } else if (message.length > 200 || context.escalationLevel > 0) {
      escalationLevel = 1;
    }

    return {
      response,
      escalationLevel,
      isCrisis,
      needsEscalation,
      confidence: 0.8
    };

  } catch (error) {
    console.error('AI Chatbot error:', error);
    
    // Fallback response
    const fallbackResponses = {
      'en': "I'm here to listen and support you. I'm experiencing some technical difficulties right now, but please know that your feelings are valid and important. If you're in crisis, please contact emergency services immediately.",
      'hi': "मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहाँ हूँ। मुझे अभी कुछ तकनीकी समस्याएं आ रही हैं, लेकिन कृपया जान लें कि आपकी भावनाएं वैध और महत्वपूर्ण हैं।",
      'ta': "நான் உங்களைக் கேட்டு ஆதரிக்க இங்கே இருக்கிறேன். இப்போது சில தொழில்நுட்ப சிக்கல்கள் உள்ளன, ஆனால் உங்கள் உணர்வுகள் செல்லுபடியாகும் மற்றும் முக்கியமானவை என்பதை அறிந்து கொள்ளுங்கள்."
    };

    return {
      response: fallbackResponses[language] || fallbackResponses['en'],
      escalationLevel: 2,
      isCrisis: false,
      needsEscalation: true,
      confidence: 0.3
    };
  }
};

// Generate coping strategies based on mood
const generateCopingStrategies = async (mood, language = 'en') => {
  const moodStrategies = {
    'stressed': {
      'en': [
        "Take 5 deep breaths and focus on your breathing",
        "Try the 5-4-3-2-1 grounding technique: Name 5 things you see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste",
        "Take a short walk or do some gentle stretching",
        "Write down what's causing your stress in a journal"
      ],
      'hi': [
        "5 गहरी सांसें लें और अपनी सांस पर ध्यान दें",
        "5-4-3-2-1 ग्राउंडिंग तकनीक आज़माएं",
        "थोड़ी देर टहलें या हल्का व्यायाम करें",
        "अपनी चिंता का कारण एक डायरी में लिखें"
      ]
    },
    'anxious': {
      'en': [
        "Practice box breathing: Inhale for 4, hold for 4, exhale for 4, hold for 4",
        "Use progressive muscle relaxation",
        "Try mindfulness meditation for 5 minutes",
        "Challenge anxious thoughts with evidence"
      ],
      'hi': [
        "बॉक्स ब्रीदिंग का अभ्यास करें",
        "प्रोग्रेसिव मसल रिलैक्सेशन का उपयोग करें",
        "5 मिनट के लिए माइंडफुलनेस मेडिटेशन करें",
        "चिंतित विचारों को साक्ष्य से चुनौती दें"
      ]
    },
    'sad': {
      'en': [
        "Connect with a friend or family member",
        "Engage in a favorite hobby or activity",
        "Practice self-compassion and kind self-talk",
        "Listen to uplifting music or watch something funny"
      ],
      'hi': [
        "किसी मित्र या परिवार के सदस्य से जुड़ें",
        "किसी पसंदीदा शौक या गतिविधि में संलग्न हों",
        "आत्म-करुणा और दयालु आत्म-वार्ता का अभ्यास करें",
        "उत्थानकारी संगीत सुनें या कुछ मजेदार देखें"
      ]
    }
  };

  const strategies = moodStrategies[mood]?.[language] || moodStrategies[mood]?.['en'] || [
    "Take a moment to breathe deeply",
    "Practice gratitude by listing 3 things you're thankful for",
    "Engage in a calming activity you enjoy",
    "Reach out to someone you trust"
  ];

  return strategies;
};

// Generate personalized response based on user context
const generatePersonalizedResponse = async (message, userContext, language = 'en') => {
  try {
    const contextPrompt = `User context:
- Current mood: ${userContext.currentMood || 'unknown'}
- Recent stress level: ${userContext.stressLevel || 'unknown'}
- Department: ${userContext.department || 'unknown'}
- Year: ${userContext.year || 'unknown'}
- Previous interactions: ${userContext.interactionCount || 0}

User message: ${message}

Provide a personalized, supportive response that takes into account their current situation and academic context.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + `\n\n${contextPrompt}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    return {
      response: completion.choices[0].message.content,
      escalationLevel: 0,
      isCrisis: false,
      needsEscalation: false,
      confidence: 0.9
    };

  } catch (error) {
    console.error('Personalized response error:', error);
    return await generateResponse(message, userContext, language);
  }
};

module.exports = {
  generateResponse,
  generateCopingStrategies,
  generatePersonalizedResponse,
  SAFETY_PROMPTS
};

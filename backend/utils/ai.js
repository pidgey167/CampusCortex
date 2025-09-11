// Mock AI utilities for Harbor

const RISK_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it',
  'hopeless',
  'no way out',
  'die',
  'end my life'
]

const HINDI_TAMIL_PROVERBS = [
  'Chinta chita samaan — worry is like a funeral pyre; release it gently.',
  'Aaram se, sab theek hoga — take it easy, it will be okay.',
  'Idam porul evvalavu sirithāl, uḷ porul athigam. (Tamil: Inner wealth matters more.)',
  'Thalai sūdu thalaiyai sīthala paduththāl mātram — cool the mind to change.'
]

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function detectRisk(text = '') {
  const lower = text.toLowerCase()
  return RISK_KEYWORDS.some(k => lower.includes(k))
}

async function generateResponse(message, mood = 'Neutral') {
  const moodAdvice = {
    Stressed: 'Try box breathing: inhale 4, hold 4, exhale 4, hold 4.',
    Anxious: 'Ground yourself: notice 5 things you see, 4 touch, 3 hear.',
    Sad: 'Be gentle with yourself; small steps count today.',
    Angry: 'Pause and breathe; a short walk can help release tension.',
    Neutral: 'Let’s nurture calm and clarity together.'
  }

  const calming = moodAdvice[mood] || moodAdvice.Neutral
  const proverb = pick(HINDI_TAMIL_PROVERBS)

  const base = `I hear you. ${calming} ${proverb}`
  const follow = 'Would you like a short breathing exercise or an affirmation?'
  return {
    text: `${base} ${follow}`,
    risk: detectRisk(message)
  }
}

module.exports = {
  generateResponse,
  detectRisk
}



const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { generateResponse, detectRisk } = require('../utils/ai');

// Fallback HTTP processing (non-socket)
router.post('/process', auth, async (req, res) => {
	try {
		const { message, mood } = req.body || {};
		if (!message) {
			return res
				.status(400)
				.json({ success: false, message: 'message is required' });
		}

		const result = await generateResponse(message, mood);
		const isRisk = result.risk || detectRisk(message);

		// Placeholder: send encrypted alert to authority (email/system) when risk
		if (isRisk) {
			const io = req.app.get('io');
			io.to('authority-room').emit('harbor-alert', { userId: req.user?._id });
		}

		return res.json({
			success: true,
			data: { response: result.text, risk: isRisk },
		});
	} catch (err) {
		console.error('Harbor process error:', err);
		return res
			.status(500)
			.json({ success: false, message: 'Internal server error' });
	}
});

module.exports = router;

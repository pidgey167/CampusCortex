const User = require('../models/User');
const {
	generateToken,
	generateRefreshToken,
} = require('../utils/generateToken');
const { getRedisClient } = require('../config/redis');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
	try {
		const {
			studentId,
			email,
			password,
			firstName,
			lastName,
			department,
			year,
			phone,
		} = req.body;

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { studentId }],
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message:
					existingUser.email === email
						? 'Email already registered'
						: 'Student ID already registered',
			});
		}

		// Create user
		const user = await User.create({
			studentId,
			email,
			password,
			firstName,
			lastName,
			department,
			year,
			phone,
		});

		// Generate tokens
		const token = generateToken(user._id);
		const refreshToken = generateRefreshToken(user._id);

		// Store refresh token in Redis
		const redisClient = getRedisClient();
		await redisClient.set(
			`refresh:${user._id}`,
			30 * 24 * 60 * 60,
			refreshToken
		); // 30 days

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: user.getPublicProfile(),
				token,
				refreshToken,
			},
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({
			success: false,
			message: 'Registration failed',
			error:
				process.env.NODE_ENV === 'development'
					? error.message
					: 'Internal server error',
		});
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find user by email
		const user = await User.findOne({ email }).select('+password');

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: 'Account is deactivated. Please contact support.',
			});
		}

		// Check password
		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		// Update last login
		user.lastLogin = new Date();
		await user.save();

		// Generate tokens
		const token = generateToken(user._id);
		const refreshToken = generateRefreshToken(user._id);

		// Store refresh token in Redis
		const redisClient = getRedisClient();
		await redisClient.set(
			`refresh:${user._id}`,
			30 * 24 * 60 * 60,
			refreshToken
		); // 30 days

		res.json({
			success: true,
			message: 'Login successful',
			data: {
				user: user.getPublicProfile(),
				token,
				refreshToken,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Login failed',
			error:
				process.env.NODE_ENV === 'development'
					? error.message
					: 'Internal server error',
		});
	}
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(401).json({
				success: false,
				message: 'Refresh token required',
			});
		}

		// Verify refresh token
		const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

		if (decoded.type !== 'refresh') {
			return res.status(401).json({
				success: false,
				message: 'Invalid refresh token',
			});
		}

		// Check if refresh token exists in Redis
		const redisClient = getRedisClient();
		const storedToken = await redisClient.get(`refresh:${decoded.id}`);

		if (!storedToken || storedToken !== refreshToken) {
			return res.status(401).json({
				success: false,
				message: 'Invalid refresh token',
			});
		}

		// Get user
		const user = await User.findById(decoded.id);

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				message: 'User not found or inactive',
			});
		}

		// Generate new tokens
		const newToken = generateToken(user._id);
		const newRefreshToken = generateRefreshToken(user._id);

		// Update refresh token in Redis
		await redisClient.set(
			`refresh:${user._id}`,
			30 * 24 * 60 * 60,
			newRefreshToken
		);

		res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: {
				token: newToken,
				refreshToken: newRefreshToken,
			},
		});
	} catch (error) {
		console.error('Refresh token error:', error);
		res.status(401).json({
			success: false,
			message: 'Invalid refresh token',
		});
	}
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
		const redisClient = getRedisClient();

		// Blacklist current token
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			await redisClient.set(`blacklist:${token}`, 7 * 24 * 60 * 60, 'true'); // 7 days
		}

		// Remove refresh token
		if (req.user) {
			await redisClient.del(`refresh:${req.user._id}`);
		}

		res.json({
			success: true,
			message: 'Logged out successfully',
		});
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({
			success: false,
			message: 'Logout failed',
		});
	}
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		res.json({
			success: true,
			data: {
				user: user.getPublicProfile(),
			},
		});
	} catch (error) {
		console.error('Get me error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get user data',
		});
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, department, year, phone, preferences } =
			req.body;

		const user = await User.findById(req.user._id);

		if (firstName) user.firstName = firstName;
		if (lastName) user.lastName = lastName;
		if (department) user.department = department;
		if (year) user.year = year;
		if (phone) user.phone = phone;
		if (preferences) {
			user.preferences = { ...user.preferences, ...preferences };
		}

		await user.save();

		res.json({
			success: true,
			message: 'Profile updated successfully',
			data: {
				user: user.getPublicProfile(),
			},
		});
	} catch (error) {
		console.error('Update profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update profile',
		});
	}
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		const user = await User.findById(req.user._id).select('+password');

		// Check current password
		const isCurrentPasswordValid = await user.comparePassword(currentPassword);

		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				success: false,
				message: 'Current password is incorrect',
			});
		}

		// Update password
		user.password = newPassword;
		await user.save();

		res.json({
			success: true,
			message: 'Password changed successfully',
		});
	} catch (error) {
		console.error('Change password error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to change password',
		});
	}
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Store reset token in Redis
		const redisClient = getRedisClient();
		await redisClient.set(`reset:${resetToken}`, 600, user._id.toString()); // 10 minutes

		// TODO: Send email with reset link
		// For now, just return the token (in production, send via email)
		res.json({
			success: true,
			message: 'Password reset token generated',
			data: {
				resetToken:
					process.env.NODE_ENV === 'development' ? resetToken : undefined,
			},
		});
	} catch (error) {
		console.error('Forgot password error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to process forgot password request',
		});
	}
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
	try {
		const { resetToken, newPassword } = req.body;

		if (!resetToken) {
			return res.status(400).json({
				success: false,
				message: 'Reset token is required',
			});
		}

		// Check if reset token exists
		const redisClient = getRedisClient();
		const userId = await redisClient.get(`reset:${resetToken}`);

		if (!userId) {
			return res.status(400).json({
				success: false,
				message: 'Invalid or expired reset token',
			});
		}

		// Update password
		const user = await User.findById(userId);
		user.password = newPassword;
		await user.save();

		// Delete reset token
		await redisClient.del(`reset:${resetToken}`);

		res.json({
			success: true,
			message: 'Password reset successfully',
		});
	} catch (error) {
		console.error('Reset password error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to reset password',
		});
	}
};

module.exports = {
	register,
	login,
	refreshToken,
	logout,
	getMe,
	updateProfile,
	changePassword,
	forgotPassword,
	resetPassword,
};

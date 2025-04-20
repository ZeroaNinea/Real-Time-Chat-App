import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
// import jwt from 'jsonwebtoken';
import { signToken } from '../auth/jwt.service';

import { User } from '../models/user.model';
import { redisClient } from '../config/redis';
import { buildAccountResponse } from '../helpers/account-response';

// Get keys.
const privateKey = fs.readFileSync(
  path.join(__dirname, '../../keys/private.pem'),
  'utf-8'
);

// Middleware to handle async routes.
export const asyncRoute =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: unknown) => {
      if (error instanceof Error) {
        console.error('Error in route:', error.message);
      }
      next(error);
    });
  };

// The function to delete the avatar file. Called in the removeAvatar and deleteAccount controllers.
const deleteAvatarFile = async (user: any) => {
  if (user.avatar) {
    const fullPath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath); // Delete the avatar file.
    }
    user.avatar = '';
    await user.save();
  }
};

// Register user.
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists.
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send('Username already exists.');

    // Create new user.
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// Login user.
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // ✅ Use your signToken helper.
    const token = await signToken({ id: user._id, username: user.username });

    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// Delete account.
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided.' });

    const { password } = req.body;
    if (!password)
      return res.status(400).json({ message: 'Password is required.' });

    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password.' });

    await deleteAvatarFile(user);
    await User.deleteOne({ _id: userId });
    await redisClient.del(`auth:${user._id}:${token}`);

    res.status(200).json({ message: 'Account deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during account deletion.' });
  }
};

// Logout controller.
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !req.auth?.id) {
      return res.status(400).json({ message: 'No token or user ID provided.' });
    }

    const redisKey = `auth:${req.auth.id}:${token}`;
    await redisClient.del(redisKey);

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during logout.' });
  }
};

// Protected route.
export const account = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.status(200).json(buildAccountResponse(user));
};

// Update email.
export const updateEmail = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const existing = await User.findOne({ email });
  if (existing && existing._id.toString() !== userId.toString()) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const user = await User.findByIdAndUpdate(userId, { email }, { new: true });

  res.status(200).json(buildAccountResponse(user));
};

// Update username and bio.
export const updateUsernameBio = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { username, bio } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (!bio) {
    return res.status(400).json({ message: 'Bio is required' });
  }

  const existing = await User.findOne({ username });

  if (existing && existing._id.toString() !== userId.toString()) {
    return res.status(409).json({ message: 'Username already in use' });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { username, bio },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(buildAccountResponse(updatedUser));
};

// Update password.
export const updatePassword = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Both current and new password are required' });
  }

  const user = await User.findById(userId);
  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(buildAccountResponse(user));
};

// Update avatar.
export const updateAvatar = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No avatar uploaded' });
  }

  const oldAvatarPath = req.body.oldAvatar;

  // Delete old avatar if present.
  if (oldAvatarPath) {
    const fullPath = path.join(__dirname, '../../', oldAvatarPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath); // Remove the file.
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { avatar: `uploads/avatars/${req.file.filename}` },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ avatar: user.avatar });
};

// Remove avatar.
export const removeAvatar = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await deleteAvatarFile(user);
    res.status(200).json({ message: 'Avatar removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during avatar removal.' });
  }
};

// Update email.
export const updatePronouns = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { pronouns } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { pronouns },
    { new: true }
  );

  res.status(200).json(buildAccountResponse(user));
};

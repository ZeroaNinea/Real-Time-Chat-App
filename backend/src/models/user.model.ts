import mongoose from '../config/db';
import bcrypt from 'bcrypt';
import { Document } from 'mongoose';

export interface IUser {
  username: string;
  email?: string;
  password: string;
  avatar?: string;
  bio?: string;
  pronouns?: string;
  status?: string;
  friends?: string[];
  banlist?: string[];
  pendingRequests?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument extends IUser, Document {}

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    pronouns: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: '',
    },
    friends: {
      type: [String],
      default: [],
    },
    banlist: {
      type: [String],
      default: [],
    },
    pendingRequests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);

  next();
});

// Compare password for login.
UserSchema.methods.comparePassword = async function (password: string) {
  if (!password) throw new Error('Password is required.');
  // if (!this.password) throw new Error(`User has no password.`);

  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<UserDocument>('User', UserSchema);

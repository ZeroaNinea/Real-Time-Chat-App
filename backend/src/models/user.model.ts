import mongoose from '../config/db';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
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
    profilePicture: {
      type: String,
      default: '',
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

export const User = mongoose.model('User', UserSchema);

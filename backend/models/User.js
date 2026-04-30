import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual for full name ────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Index for faster queries ─────────────────────────────────
// userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

// ── Hash password BEFORE saving to database ──────────────────
userSchema.pre('save', async function () {
  // Only hash if password was actually changed
  if (!this.isModified('password')) return;

  // 12 = industry standard cost factor (balance of security vs speed)
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Method to compare passwords at login ─────────────────────
userSchema.methods.correctPassword = async function (candidatePassword) {
  // 'this.password' works because the method is called on the document instance
  return await bcrypt.compare(candidatePassword, this.password);
};

// ── Method to hide sensitive fields in JSON output ────────────
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);
export default User;
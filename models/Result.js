import mongoose from 'mongoose';
import slugify from 'slugify';

const ResultSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  organization: { type: String },
  postDate: { type: Date, default: Date.now },
  resultUrl: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

ResultSchema.pre('validate', function(next) {
  if (this.examName) {
    this.slug = slugify(`${this.examName}-${this.organization || ''}`, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Result', ResultSchema);
import mongoose from 'mongoose';
import slugify from 'slugify';

const ResultSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  organization: { type: String },
  category: { type: String, enum: ['SSC', 'Banking', 'Railway', 'Police', 'Teaching', 'UPSC', 'Other'] }, // YEH NAYI LINE
  postDate: { type: Date, default: Date.now },
  resultUrl: { type: String, required: true },
}, { timestamps: true });
ResultSchema.pre('validate', function(next) {
  if (this.examName) {
    this.slug = slugify(`${this.examName}-${this.organization || ''}`, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Result', ResultSchema);
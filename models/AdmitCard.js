// models/AdmitCard.js (Corrected)

import mongoose from 'mongoose';
import slugify from 'slugify';

const AdmitCardSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  organization: { type: String },
  postDate: { type: Date, default: Date.now },
  downloadUrl: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

AdmitCardSchema.pre('validate', async function (next) {
    if (this.isModified('examName') || this.isModified('organization') || !this.slug) {
        const baseSlug = slugify(`${this.examName}-${this.organization || ''}`, { lower: true, strict: true });
        let slug = baseSlug;
        let count = 2;
        // eslint-disable-next-line no-await-in-loop
        while (await this.constructor.findOne({ slug })) {
            slug = `${baseSlug}-${count}`;
            count++;
        }
        this.slug = slug;
    }
    next();
});

// THIS IS THE MOST IMPORTANT LINE
export default mongoose.model('AdmitCard', AdmitCardSchema);
import mongoose from 'mongoose';
import slugify from 'slugify';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  postDate: { type: Date, default: Date.now },
  lastDate: { type: Date },
  description: { type: String, required: true },
  applyUrl: { type: String },
  noticeUrl: { type: String },
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

// Auto-generate a URL-friendly slug from the title before saving
// This new version handles duplicates by adding -2, -3, etc.
JobSchema.pre('validate', async function (next) {
    if (this.isModified('title') || this.isModified('organization') || !this.slug) {
        const baseSlug = slugify(`${this.title}-${this.organization}`, { lower: true, strict: true });
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

export default mongoose.model('Job', JobSchema);
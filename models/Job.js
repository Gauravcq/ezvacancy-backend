// models/Job.js (Final Upgraded Version)
import mongoose from 'mongoose';
import slugify from 'slugify';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  postUpdateDate: { type: Date, default: Date.now },
  shortDescription: { type: String, required: true }, // Short summary for the post page

  // Details ke liye naye fields (inhe Admin Panel mein text area banayenge)
  importantDates: { type: String }, 
  applicationFee: { type: String },
  ageLimit: { type: String },
  vacancyDetails: { type: String },

  // Links
  applyUrl: { type: String },
  noticeUrl: { type: String },
  officialWebsiteUrl: { type: String },

  // Unique URL ke liye
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

// Slug banane wala code
JobSchema.pre('validate', async function (next) {
    if (this.isModified('title') || !this.slug) {
        const baseSlug = slugify(this.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
        let slug = baseSlug;
        let count = 2;
        while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${count}`;
            count++;
        }
        this.slug = slug;
    }
    next();
});

export default mongoose.model('Job', JobSchema);
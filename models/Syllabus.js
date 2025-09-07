// models/Syllabus.js

import mongoose from 'mongoose';
import slugify from 'slugify';

const SyllabusSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  organization: { type: String, required: true },
  postUpdateDate: { type: Date, default: Date.now },
  
  // Poora syllabus content save karne ke liye
  details: { type: String, required: true },

  // Unique URL ke liye
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

// Slug banane wala code
SyllabusSchema.pre('validate', async function (next) {
    if (this.isModified('examName') || !this.slug) {
        const baseSlug = slugify(this.examName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
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

export default mongoose.model('Syllabus', SyllabusSchema);
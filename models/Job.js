// models/Job.js

import mongoose from 'mongoose';
import slugify from 'slugify';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  
  // --- YEH DO NAYI LINES ADD KAREIN ---
  category: { type: String, enum: ['SSC', 'Banking', 'Railway', 'Police', 'Teaching', 'UPSC', 'Other'], required: true },
  scope: { type: String, enum: ['Central', 'State'], required: true },
  // ------------------------------------

  postDate: { type: Date, default: Date.now },
  lastDate: { type: Date },
  description: { type: String, required: true },
  applyUrl: { type: String },
  noticeUrl: { type: String },
  slug: { type: String, unique: true, index: true },
}, { timestamps: true });

// ... baaki ka code same rahega ...

export default mongoose.model('Job', JobSchema);
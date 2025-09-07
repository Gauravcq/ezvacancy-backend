// models/AnswerKey.js

import mongoose from 'mongoose';

const AnswerKeySchema = new mongoose.Schema({
  examName: { type: String, required: true },
  organization: { type: String },
  postDate: { type: Date, default: Date.now },
  downloadUrl: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('AnswerKey', AnswerKeySchema);
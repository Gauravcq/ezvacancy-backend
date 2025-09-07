// server.js (The Absolute Final, Bulletproof Version)

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/mongoose';

import Job from './models/Job.js';
import AdmitCard from './models/AdmitCard.js';
import Result from './models/Result.js';
import AnswerKey from './models/AnswerKey.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',') }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === PUBLIC API ROUTES (FINAL SMART VERSION) ===
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Job.find({}).sort({ postUpdateDate: -1 }).limit(parseInt(limit)).lean();
  // NAYA CHANGE: Har item mein 'type' ka sticker lagao
  const taggedData = data.map(item => ({ ...item, type: 'notification' }));
  res.json({ data: taggedData });
}));

app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await AdmitCard.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  // NAYA CHANGE: Har item mein 'type' ka sticker lagao
  const taggedData = data.map(item => ({ ...item, type: 'admit-card' }));
  res.json({ data: taggedData });
}));

app.get('/api/results', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Result.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  // NAYA CHANGE: Har item mein 'type' ka sticker lagao
  const taggedData = data.map(item => ({ ...item, type: 'result' }));
  res.json({ data: taggedData });
}));

app.get('/api/answer-keys', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const data = await AnswerKey.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
    // NAYA CHANGE: Har item mein 'type' ka sticker lagao
    const taggedData = data.map(item => ({ ...item, type: 'answer-key' }));
    res.json({ data: taggedData });
}));

app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
    const job = await Job.findOne({ slug: req.params.slug }).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
}));

// === ADMINJS SETUP (Ismein koi change nahi) ===
const start = async () => { /* ... baaki ka server code same rahega ... */ };
start().catch(err => console.error("Fatal server error:", err));
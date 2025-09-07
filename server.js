// server.js (The Absolute Final Version with Syllabus Feature)

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

// Saare zaroori Models ko import karein
import Job from './models/Job.js';
import AdmitCard from './models/AdmitCard.js';
import Result from './models/Result.js';
import AnswerKey from './models/AnswerKey.js';
import Syllabus from './models/Syllabus.js'; // Naya Syllabus model

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware Setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(helmet({ contentSecurityPolicy: false })); // AdminJS ke liye yeh zaroori hai
app.use(express.json());
app.use(morgan('tiny')); // Request logging ke liye

// Async error handling ke liye helper function
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === PUBLIC API ROUTES (FINAL VERSION) ===

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Homepage ke liye data
app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Job.find({}).sort({ postUpdateDate: -1 }).limit(parseInt(limit)).lean();
  const taggedData = data.map(item => ({ ...item, type: 'notification' }));
  res.json({ data: taggedData });
}));
app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await AdmitCard.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  const taggedData = data.map(item => ({ ...item, type: 'admit-card' }));
  res.json({ data: taggedData });
}));
app.get('/api/results', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Result.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  const taggedData = data.map(item => ({ ...item, type: 'result' }));
  res.json({ data: taggedData });
}));
app.get('/api/answer-keys', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const data = await AnswerKey.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
    const taggedData = data.map(item => ({ ...item, type: 'answer-key' }));
    res.json({ data: taggedData });
}));

// NAYE ROUTES: Syllabus ke liye
app.get('/api/syllabuses', asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const data = await Syllabus.find({}).sort({ postUpdateDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

app.get('/api/syllabuses/:slug', asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.findOne({ slug: req.params.slug }).lean();
    if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
    res.json(syllabus);
}));

// Job Detail Page ke liye
app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
    const job = await Job.findOne({ slug: req.params.slug }).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
}));

// === ADMINJS SETUP ===
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected...');

  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    resources: [
        { resource: Job, options: { parent: { name: 'Content Management' }, properties: { shortDescription: { type: 'textarea' }, importantDates: { type: 'textarea' }, applicationFee: { type: 'textarea' }, ageLimit: { type: 'textarea' }, vacancyDetails: { type: 'textarea' } } } },
        { resource: AdmitCard, options: { parent: { name: 'Content Management' } } },
        { resource: Result, options: { parent: { name: 'Content Management' } } },
        { resource: AnswerKey, options: { parent: { name: 'Content Management' } } },
        { resource: Syllabus, options: { parent: { name: 'Content Management' }, properties: { details: { type: 'richtext' } } } }, // Naya Syllabus resource
    ],
    rootPath: '/admin',
    branding: { companyName: 'EZGOVTJOB Admin Panel' },
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) ? { email } : null,
    cookieName: 'ezgovtjob-session',
    cookiePassword: process.env.SESSION_SECRET,
  }, null, { resave: false, saveUninitialized: false, secret: process.env.SESSION_SECRET });

  app.use(admin.options.rootPath, adminRouter);
  app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });
  app.listen(PORT, () => console.log(`Server & Admin Panel running on port ${PORT}`));
};

start().catch(err => console.error("Fatal server error:", err));
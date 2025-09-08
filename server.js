// server.js (The Absolute Final Version with All Features)

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
import Syllabus from './models/Syllabus.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware Setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

// Async error handling ke liye helper function
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// NAYA, SMART HELPER FUNCTION - Sabke liye kaam karega
const handleApiRequest = async (req, res, model, sortOptions, type) => {
    const { limit = 10, category } = req.query;
    const filter = {};
    if (category) filter.category = category; // Agar category aayi hai, toh filter karo

    const data = await model.find(filter).sort(sortOptions).limit(parseInt(limit)).lean();
    
    if (type) {
        // Agar type bataya gaya hai, toh har item mein 'type' ka sticker lagao
        const taggedData = data.map(item => ({ ...item, type }));
        res.json({ data: taggedData });
    } else {
        res.json({ data });
    }
};

// === PUBLIC API ROUTES (FINAL SMART VERSION) ===
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/jobs', (req, res) => handleApiRequest(req, res, Job, { postUpdateDate: -1 }, 'notification'));
app.get('/api/admit-cards', (req, res) => handleApiRequest(req, res, AdmitCard, { postDate: -1 }, 'admit-card'));
app.get('/api/results', (req, res) => handleApiRequest(req, res, Result, { postDate: -1 }, 'result'));
app.get('/api/answer-keys', (req, res) => handleApiRequest(req, res, AnswerKey, { postDate: -1 }, 'answer-key'));
app.get('/api/syllabuses', (req, res) => handleApiRequest(req, res, Syllabus, { postUpdateDate: -1 })); // Syllabus mein type ki zaroorat nahi

// Detail page ke liye routes
app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
    const job = await Job.findOne({ slug: req.params.slug }).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
}));

app.get('/api/syllabuses/:slug', asyncHandler(async (req, res) => {
    const syllabus = await Syllabus.findOne({ slug: req.params.slug }).lean();
    if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
    res.json(syllabus);
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
        { resource: Syllabus, options: { parent: { name: 'Content Management' }, properties: { details: { type: 'richtext' } } } },
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
// server.js (Final, Complete, and Bug-Free Version)
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

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',') }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === PUBLIC API ROUTES (FINAL VERSION) ===
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Job.find({}).sort({ postUpdateDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await AdmitCard.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

app.get('/api/results', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Result.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

// NAYA ROUTE: Ek specific job ki detail uske slug se dhoondhne ke liye
app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
    const job = await Job.findOne({ slug: req.params.slug }).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
}));

// === ADMINJS SETUP ===
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    resources: [
        { resource: Job, options: { 
            parent: { name: 'Content Management' },
            properties: { // Text Areas for easy editing
                shortDescription: { type: 'textarea' },
                importantDates: { type: 'textarea' },
                applicationFee: { type: 'textarea' },
                ageLimit: { type: 'textarea' },
                vacancyDetails: { type: 'textarea' },
            }
        }},
        { resource: AdmitCard, options: { parent: { name: 'Content Management' } } },
        { resource: Result, options: { parent: { name: 'Content Management' } } },
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
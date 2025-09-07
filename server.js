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

// Saare zaroori Models ko import karein
import Job from './models/Job.js';
import AdmitCard from './models/AdmitCard.js';
import Result from './models/Result.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(helmet({ contentSecurityPolicy: false })); // AdminJS ke liye zaroori
app.use(express.json());
app.use(morgan('tiny')); // Request logging ke liye

// Async error handling ke liye helper function
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === PUBLIC API ROUTES (FINAL VERSION) ===

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Homepage ke liye Jobs ka data
app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Job.find({}).sort({ postUpdateDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

// Homepage ke liye Admit Cards ka data
app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await AdmitCard.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

// Homepage ke liye Results ka data
app.get('/api/results', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Result.find({}).sort({ postDate: -1 }).limit(parseInt(limit)).lean();
  res.json({ data });
}));

// NAYA AUR SABSE ZAROORI ROUTE: Ek specific job ki detail uske slug se dhoondhne ke liye
app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
    const job = await Job.findOne({ slug: req.params.slug }).lean();
    if (!job) {
        // Agar job na mile toh 404 error bhejo
        return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
}));

// === ADMINJS SETUP ===
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected...');

  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    resources: [
        { 
            resource: Job, 
            options: { 
                parent: { name: 'Content Management', icon: 'Document' },
                // Admin Panel ko behtar banane ke liye
                properties: { 
                    shortDescription: { type: 'textarea' },
                    importantDates: { type: 'textarea' },
                    applicationFee: { type: 'textarea' },
                    ageLimit: { type: 'textarea' },
                    vacancyDetails: { type: 'textarea' },
                }
            }
        },
        { resource: AdmitCard, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        { resource: Result, options: { parent: { name: 'Content Management', icon: 'Document' } } },
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

  // Aakhri error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  app.listen(PORT, () => {
    console.log(`Server & Admin Panel running on port ${PORT}`);
  });
};

start().catch(err => console.error("Fatal server error:", err));
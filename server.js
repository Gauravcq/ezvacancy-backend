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

// Saare Models ko import karein
import Job from './models/Job.js';
import AdmitCard from './models/AdmitCard.js';
import Result from './models/Result.js';
// Baki models jaise AnswerKey, RankEntry agar aapne banaye hain
// import AnswerKey from './models/AnswerKey.js';
// import RankEntry from './models/RankEntry.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
// Helmet ko theek se configure karein taaki AdminJS chale
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === PUBLIC API ROUTES (FINAL VERSION) ===

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// GET Jobs (with filters)
app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { limit = 5, category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  
  const data = await Job.find(filter).sort({ postDate: -1 }).limit(parseInt(limit, 10)).lean();
  res.json({ data });
}));

// GET Admit Cards (Naya Route)
app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const data = await AdmitCard.find({}).sort({ postDate: -1 }).limit(parseInt(limit, 10)).lean();
  res.json({ data });
}));

// GET Results (Naya Route)
app.get('/api/results', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const data = await Result.find({}).sort({ postDate: -1 }).limit(parseInt(limit, 10)).lean();
  res.json({ data });
}));


// === ADMINJS SETUP ===
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected...');

  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    resources: [
        { resource: Job, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        { resource: AdmitCard, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        { resource: Result, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        // { resource: AnswerKey, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        // { resource: RankEntry, options: { parent: { name: 'User Data', icon: 'User' } } },
    ],
    rootPath: '/admin',
    branding: { companyName: 'EZGOVTJOB Admin Panel' },
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
          return { email };
        }
        return null;
      },
      cookieName: 'ezgovtjob-session',
      cookiePassword: process.env.SESSION_SECRET,
    },
    null, { resave: false, saveUninitialized: false, secret: process.env.SESSION_SECRET }
  );

  app.use(admin.options.rootPath, adminRouter);

  // Final Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

start().catch(err => console.error("Fatal server error:", err));
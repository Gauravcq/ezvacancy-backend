// server.js (Updated & Improved)

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan'; // For logging requests
import session from 'express-session';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/mongoose';

// Import Models
import Job from './models/Job.js';
import AdmitCard from './models/AdmitCard.js';
import Result from './models/Result.js';

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
// This is the corrected line
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny')); // Logs requests like "GET /api/jobs 200"

// --- Helper for cleaner async routes ---
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


// --- PUBLIC API ROUTES (with Search, Pagination, and Filtering) ---

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// GET Jobs
app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { organization: { $regex: q, $options: 'i' } },
    ];
  }
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Job.find(filter).sort({ postDate: -1 }).skip(skip).limit(limitNum).lean(),
    Job.countDocuments(filter),
  ]);

  res.json({ data, page: pageNum, totalPages: Math.ceil(total / limitNum), total });
}));

// GET a single Job by its slug
app.get('/api/jobs/:slug', asyncHandler(async (req, res) => {
  const job = await Job.findOne({ slug: req.params.slug }).lean();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
}));


// GET Admit Cards
app.get('/api/admit-cards', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = q ? { $or: [{ examName: { $regex: q, $options: 'i' } }, { organization: { $regex: q, $options: 'i' } }] } : {};
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    AdmitCard.find(filter).sort({ postDate: -1 }).skip(skip).limit(limitNum).lean(),
    AdmitCard.countDocuments(filter),
  ]);

  res.json({ data, page: pageNum, totalPages: Math.ceil(total / limitNum), total });
}));

// GET a single Admit Card by its slug
app.get('/api/admit-cards/:slug', asyncHandler(async (req, res) => {
    const admitCard = await AdmitCard.findOne({ slug: req.params.slug }).lean();
    if (!admitCard) return res.status(404).json({ error: 'Admit Card not found' });
    res.json(admitCard);
}));


// GET Results
app.get('/api/results', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = q ? { $or: [{ examName: { $regex: q, $options: 'i' } }, { organization: { $regex: q, $options: 'i' } }] } : {};
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Result.find(filter).sort({ postDate: -1 }).skip(skip).limit(limitNum).lean(),
    Result.countDocuments(filter),
  ]);

  res.json({ data, page: pageNum, totalPages: Math.ceil(total / limitNum), total });
}));

// GET a single Result by its slug
app.get('/api/results/:slug', asyncHandler(async (req, res) => {
    const result = await Result.findOne({ slug: req.params.slug }).lean();
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json(result);
}));


// --- ADMINJS SETUP ---
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected...');

  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    resources: [
        { resource: Job, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        { resource: AdmitCard, options: { parent: { name: 'Content Management', icon: 'Document' } } },
        { resource: Result, options: { parent: { name: 'Content Management', icon: 'Document' } } },
    ],
    rootPath: '/admin',
    branding: { companyName: 'EZ Vacancy Admin Panel' },
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
      cookieName: 'admin-session',
      cookiePassword: process.env.SESSION_SECRET,
    },
    null, { resave: false, saveUninitialized: false, secret: process.env.SESSION_SECRET }
  );

  app.use(admin.options.rootPath, adminRouter);


  // --- Final Error Handler ---
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
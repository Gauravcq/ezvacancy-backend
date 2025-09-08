// FILE: ezvacancy-backend/server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Sequelize, DataTypes } from 'sequelize';
import AdminJSSequelize from '@adminjs/sequelize';
import session from 'express-session';

// === 1. DATABASE CONNECTION ===
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});
AdminJS.registerAdapter({ Database: AdminJSSequelize.Database, Resource: AdminJSSequelize.Resource });

// === 2. MODELS IMPORT & RELATIONSHIPS ===
import CategoryModel from './models/Category.js';
import SubCategoryModel from './models/SubCategory.js';
import PostModel from './models/Post.js';
const Category = CategoryModel(sequelize, DataTypes);
const SubCategory = SubCategoryModel(sequelize, DataTypes);
const Post = PostModel(sequelize, DataTypes);
Category.hasMany(SubCategory, { foreignKey: 'CategoryId' });
SubCategory.belongsTo(Category, { foreignKey: 'CategoryId' });
SubCategory.hasMany(Post, { foreignKey: 'SubCategoryId' });
Post.belongsTo(SubCategory, { foreignKey: 'SubCategoryId' });

// === 3. APP & MIDDLEWARE SETUP ===
const app = express();
const PORT = process.env.PORT || 8080;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

// === 4. PUBLIC API ROUTES ===
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/homepage-sections', asyncHandler(async (req, res) => {
    const sscPosts = await Post.findAll({ limit: 10, order: [['postDate', 'DESC']], include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'ssc' }}}});
    const railwayPosts = await Post.findAll({ limit: 10, order: [['postDate', 'DESC']], include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'railway' }}}});
    const bankingPosts = await Post.findAll({ limit: 10, order: [['postDate', 'DESC']], include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'banking' }}}});
    res.json({ ssc: sscPosts, railway: railwayPosts, banking: bankingPosts });
}));
app.get('/api/posts/:slug', asyncHandler(async (req, res) => {
    const post = await Post.findOne({ where: { slug: req.params.slug }, include: { model: SubCategory, include: { model: Category } } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
}));
app.get('/api/category/:categorySlug', asyncHandler(async (req, res) => {
    const posts = await Post.findAll({ order: [['postDate', 'DESC']], include: { model: SubCategory, required: true, include: { model: Category, where: { slug: req.params.categorySlug }}}});
    res.json(posts);
}));
app.get('/api/posts/type/:postType', asyncHandler(async (req, res) => {
    const { postType } = req.params;
    const validTypes = ['notification', 'result', 'admit-card', 'answer-key', 'syllabus'];
    if (!validTypes.includes(postType)) { return res.status(400).json({ message: 'Invalid post type' }); }
    const posts = await Post.findAll({ where: { postType: postType }, order: [['postDate', 'DESC']], include: { model: SubCategory, include: { model: Category } } });
    res.json(posts);
}));

// === 5. ADMINJS SETUP & SERVER START ===
const start = async () => {
  await sequelize.sync({ alter: true });
  console.log('PostgreSQL DB Synced.');

  const admin = new AdminJS({
    resources: [
        Category, SubCategory,
        {
            resource: Post,
            options: {
                // This is now very simple. No complex hooks or components.
                properties: {
                    importantDates: { type: 'textarea' },
                    applicationFee: { type: 'textarea' },
                    ageLimit: { type: 'textarea' },
                    vacancyDetails: { type: 'textarea' },
                    usefulLinks: { type: 'textarea' },
                    shortInformation: { type: 'textarea' },
                    howToApply: { type: 'textarea' },
                    postType: { availableValues: [ { value: 'notification', label: 'Notification / Job' }, { value: 'result', label: 'Result' }, { value: 'admit-card', label: 'Admit Card' }, { value: 'answer-key', label: 'Answer Key' }, { value: 'syllabus', label: 'Syllabus' } ]},
                },
            },
        },
    ],
    rootPath: '/admin',
    branding: { companyName: 'EZGOVTJOB Admin Panel' },
  });

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) ? { email } : null,
    cookieName: 'ezgovtjob-session',
    cookiePassword: process.env.SESSION_SECRET,
  }, null, { 
    resave: false, 
    saveUninitialized: false, 
    secret: process.env.SESSION_SECRET,
    cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
  });

  app.use(admin.options.rootPath, adminRouter);
  app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });
  app.listen(PORT, () => console.log(`Server & Admin Panel running on port ${PORT}`));
};

start().catch(err => console.error("Fatal server error:", err));
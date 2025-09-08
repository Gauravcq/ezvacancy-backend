// server.js (UPDATED VERSION with Structured Data Fields)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Sequelize, DataTypes } from 'sequelize';

// AdminJS ka naya adapter import karein
import AdminJSSequelize from '@adminjs/sequelize';

// Helper function to parse key-value string to JSON
const parseKeyValueString = (str) => {
    if (!str || typeof str !== 'string') return null;
    const obj = {};
    str.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            if (key && value) {
                obj[key] = value;
            }
        }
    });
    return Object.keys(obj).length > 0 ? obj : null;
};


// === STEP 1: DATABASE CONNECTION (SEQUELIZE) ===
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// AdminJS ke liye adapter register karein
AdminJS.registerAdapter({
  Database: AdminJSSequelize.Database,
  Resource: AdminJSSequelize.Resource,
});

// === STEP 2: MODELS IMPORT & RELATIONSHIPS ===
import CategoryModel from './models/Category.js';
import SubCategoryModel from './models/SubCategory.js';
import PostModel from './models/Post.js';

const Category = CategoryModel(sequelize, DataTypes);
const SubCategory = SubCategoryModel(sequelize, DataTypes);
const Post = PostModel(sequelize, DataTypes);

// Relationships define karein
Category.hasMany(SubCategory, { foreignKey: 'CategoryId' });
SubCategory.belongsTo(Category, { foreignKey: 'CategoryId' });

SubCategory.hasMany(Post, { foreignKey: 'SubCategoryId' });
Post.belongsTo(SubCategory, { foreignKey: 'SubCategoryId' });


const app = express();
const PORT = process.env.PORT || 8080;

// === STEP 3: MIDDLEWARE (Yeh same rahega) ===
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

// === STEP 4: PUBLIC API ROUTES (NAYE STRUCTURE KE SAATH) ===
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Homepage ke liye 3 sections ka data laane wala API
app.get('/api/homepage-sections', asyncHandler(async (req, res) => {
    const sscPosts = await Post.findAll({
        limit: 10, order: [['postDate', 'DESC']],
        include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'ssc' }}}
    });
    const railwayPosts = await Post.findAll({
        limit: 10, order: [['postDate', 'DESC']],
        include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'railway' }}}
    });
    const bankingPosts = await Post.findAll({
        limit: 10, order: [['postDate', 'DESC']],
        include: { model: SubCategory, required: true, include: { model: Category, where: { slug: 'banking' }}}
    });

    res.json({ ssc: sscPosts, railway: railwayPosts, banking: bankingPosts });
}));

// Ek single post ko uske slug se fetch karne ka API (YEH UPDATE HUA HAI)
app.get('/api/posts/:slug', asyncHandler(async (req, res) => {
    const post = await Post.findOne({
        where: { slug: req.params.slug },
        include: { model: SubCategory, include: { model: Category } }
    });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // API response bhejte samay text fields ko JSON me convert karein
    const responseData = {
        ...post.toJSON(),
        importantDates: post.importantDates,
        applicationFee: post.applicationFee,
        vacancyDetails: post.vacancyDetails,
        usefulLinks: post.usefulLinks,
    };
    
    res.json(responseData);
}));

// Category ke saare posts laane ka API (Jaise saare SSC posts)
app.get('/api/category/:categorySlug', asyncHandler(async (req, res) => {
    const posts = await Post.findAll({
        order: [['postDate', 'DESC']],
        include: { model: SubCategory, required: true, include: { model: Category, where: { slug: req.params.categorySlug }}}
    });
    res.json(posts);
}));


// === STEP 5: ADMINJS SETUP (YEH PURI TARAH SE UPDATE HUA HAI) ===
const start = async () => {
  // Database se connect karein aur tables banayein
  await sequelize.sync({ alter: true }); // `alter: true` naye columns ko add kar dega bina data delete kiye
  console.log('PostgreSQL DB Synced.');

  const admin = new AdminJS({
    resources: [
        Category,
        SubCategory,
        {
            resource: Post,
            options: {
                properties: {
                    // Har field ko ek bada text box banayein
                    shortInformation: { type: 'textarea' },
                    importantDates: { type: 'textarea' },
                    applicationFee: { type: 'textarea' },
                    vacancyDetails: { type: 'textarea' },
                    howToApply: { type: 'textarea' },
                    usefulLinks: { type: 'textarea' },

                    postType: {
                        availableValues: [
                            { value: 'notification', label: 'Notification / Job' },
                            { value: 'result', label: 'Result' },
                            { value: 'admit-card', label: 'Admit Card' },
                            { value: 'answer-key', label: 'Answer Key' },
                            { value: 'syllabus', label: 'Syllabus' },
                        ],
                    },
                },
                // Admin panel me fields ko group karein
                editProperties: ['title', 'slug', 'postType', 'SubCategoryId', 'postDate', 'shortInformation', 'importantDates', 'applicationFee', 'vacancyDetails', 'howToApply', 'usefulLinks'],
                showProperties: ['title', 'slug', 'postType', 'SubCategoryId', 'postDate', 'shortInformation', 'importantDates', 'applicationFee', 'vacancyDetails', 'howToApply', 'usefulLinks'],
                listProperties: ['id', 'title', 'postType', 'postDate'],

                // Data save karne se pehle text ko JSON me convert karein
                actions: {
                    new: {
                        before: async (request) => {
                            const { payload } = request;
                            if (payload.importantDates) payload.importantDates = parseKeyValueString(payload.importantDates);
                            if (payload.applicationFee) payload.applicationFee = parseKeyValueString(payload.applicationFee);
                            if (payload.vacancyDetails) payload.vacancyDetails = parseKeyValueString(payload.vacancyDetails);
                            if (payload.usefulLinks) payload.usefulLinks = parseKeyValueString(payload.usefulLinks);
                            return request;
                        }
                    },
                    edit: {
                        before: async (request) => {
                            const { payload } = request;
                            if (payload.importantDates) payload.importantDates = parseKeyValueString(payload.importantDates);
                            if (payload.applicationFee) payload.applicationFee = parseKeyValueString(payload.applicationFee);
                            if (payload.vacancyDetails) payload.vacancyDetails = parseKeyValueString(payload.vacancyDetails);
                            if (payload.usefulLinks) payload.usefulLinks = parseKeyValueString(payload.usefulLinks);
                            return request;
                        }
                    }
                }
            },
        },
    ],
    rootPath: '/admin',
    branding: { companyName: 'EZGOVTJOB Admin Panel' },
  });

  // Authentication ke liye zaroori
  const session = (await import('express-session')).default;

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) ? { email } : null,
    cookieName: 'ezgovtjob-session',
    cookiePassword: process.env.SESSION_SECRET,
  }, null, { 
    resave: false, 
    saveUninitialized: false, 
    secret: process.env.SESSION_SECRET,
    cookie: { httpOnly: process.env.NODE_ENV === 'production', secure: process.env.NODE_ENV === 'production' }
  });

  app.use(admin.options.rootPath, adminRouter);
  app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something broke!'); });
  app.listen(PORT, () => console.log(`Server & Admin Panel running on port ${PORT}`));
};

start().catch(err => console.error("Fatal server error:", err));
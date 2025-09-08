// FILE: ezvacancy-backend/models/Post.js

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Post = sequelize.define('Post', {
    postType: {
      type: DataTypes.ENUM('notification', 'result', 'admit-card', 'answer-key', 'syllabus'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    postDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    shortInformation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    importantDates: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    applicationFee: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ageLimit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vacancyDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    howToApply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    usefulLinks: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  });
  return Post;
};
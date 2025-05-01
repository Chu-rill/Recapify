# Recapify - Your AI-Powered Document Summarization Tool

## Overview

Recapify is a web application that leverages AI to provide users with concise summaries of their documents. Built with NestJS on the backend and React on the frontend, Recapify offers a seamless experience for uploading, processing, and understanding large amounts of text.

## Features

- **Document Upload:** Users can upload documents in various formats (e.g., PDF).
- **AI-Powered Summarization:** Utilizes Google's Gemini AI to generate comprehensive summaries.
- **Key Point Extraction:** Identifies and extracts key points from the document.
- **User Authentication:** Secure user authentication using email/password and Google OAuth.
- **Role-Based Access Control:** Admin and User roles for managing access.
- **Cloud Storage:** Documents are stored securely using Cloudinary.
- **Real-time Processing Status:** Track the progress of document summarization.

## Technologies Used

### Backend (NestJS)

- [NestJS](https://nestjs.com/): A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Prisma](https://www.prisma.io/): Next-generation ORM for Node.js and TypeScript.
- [PostgreSQL](https://www.postgresql.org/): Relational database for storing user data, documents, and summaries.
- [Google Gemini AI](https://ai.google.dev/): AI model for generating document summaries.
- [Cloudinary](https://cloudinary.com/): Cloud-based media management platform for storing documents and audio files.
- [JWT (JSON Web Tokens)](https://jwt.io/): For secure authentication and authorization.
- [Passport.js](http://www.passportjs.org/): Authentication middleware for Node.js.
- [Nodemailer](https://nodemailer.com/): For sending emails (e.g., welcome emails, OTP verification).
- [Zod](https://zod.dev/): For schema validation.

### Frontend (React)

- [React](https://react.dev/): A JavaScript library for building user interfaces.
- [Vite](https://vitejs.dev/): A build tool that aims to provide a faster and leaner development experience for modern web projects.
- [TypeScript](https://www.typescriptlang.org/): A superset of JavaScript that adds static typing.
- [ESLint](https://eslint.org/): A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

## Project Structure

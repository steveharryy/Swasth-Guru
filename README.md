# Swasth Guru 🩺

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)](https://clerk.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E)](https://supabase.com/)

Swasth Guru is a comprehensive, AI-powered telemedicine and healthcare management platform built for modern medical consultation. It bridges the gap between patients and medical professionals by providing a seamless interface for booking appointments, conducting high-quality video consultations, and managing electronic health records (EHR).

## ✨ Key Features

### For Patients 🧑‍⚕️
*   **Smart Booking System**: Browse available doctors by specialization or symptoms and book immediate or scheduled consultations.
*   **Virtual Consultations**: WebRTC-powered high-quality video calls directly from the dashboard.
*   **AI Chatbot (SwasthSewak)**: Integrated Google Gemini AI-powered first-aid assistant to help diagnose mild symptoms or provide immediate guidance.
*   **Secure Medical Records**: Upload, view, and manage lab reports, prescriptions, and visit histories in a centralized vault.
*   **Health Tracking**: Monitor vital signs, current medications, and known allergies.

### For Doctors 👨‍⚕️
*   **Centralized Dashboard**: Manage daily appointments, patient queues, and overall scheduling.
*   **Patient Profiles**: Access comprehensive patient medical histories, previous visits, and vital signs before starting a consultation.
*   **Remote Prescriptions**: Issue digital prescriptions directly during or after a video call.
*   **Secure Architecture**: Compliant design ensuring patient data privacy and security.

## 🛠️ Technology Stack

**Frontend:**
*   Next.js 14 (App Router)
*   React 18
*   Tailwind CSS & Shadcn UI (Styling & Components)
*   Zustand / Context API (State Management)

**Backend & Database:**
*   Express.js & Node.js
*   Supabase (PostgreSQL)
*   Prisma ORM
*   Socket.io (Video Calls & Real-time chat)

**Integrations:**
*   **Clerk**: Secure, modern authentication.
*   **Google Gemini AI**: Conversational AI chatbot for patient triage.
*   **WebRTC**: Peer-to-peer video streaming.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your machine.

### Environment Variables
You will need to set up the following environment variables in your `.env` (Frontend) and `backend/.env` files:
*   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
*   `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `NEXT_PUBLIC_GEMINI_API_KEY`
*   `NEXT_PUBLIC_API_URL` (Points to the backend API)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/steveharryy/Swasth-Guru.git
   cd Swasth-Guru
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

### Running the Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *The backend will typically run on `http://localhost:5000`*

2. **Start the Frontend Application:**
   Open a new terminal window:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`*

## 💡 Hackathon Demo Mode
This repository contains a specialized "Demo Mode" designed for live presentations:
*   Any booked appointment is automatically flagged as a "Hackathon" session.
*   Instantly bypasses time checks, generating a **"Direct Join (Demo)"** button on both the Doctor and Patient dashboards immediately post-payment.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the MIT License.

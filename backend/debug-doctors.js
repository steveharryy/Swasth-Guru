const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const doctorSchema = new mongoose.Schema({
    clerkId: String,
    id: Number,
    name: String,
    specialization: String,
    availability: Boolean,
});

const Doctor = mongoose.model('Doctor', doctorSchema);

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/swasth-guru');
        console.log('MongoDB Connected');

        const doctors = await Doctor.find({ name: /Abhay/i });
        console.log('--- ABHAY ---');
        doctors.forEach(d => {
            console.log(`ID: ${d.id}, Name: ${d.name}, Spec: "${d.specialization}", ClerkID: ${d.clerkId}`);
        });
        console.log('--- END ---');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();

import { supabase } from './supabase.js';

const connectDB = async () => {
    try {
        console.log(`Supabase Client Initialized`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;
export { supabase };
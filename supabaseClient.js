// This tells the browser where to find the Supabase tool
const { createClient } = supabase;

const supabaseUrl = 'https://flngxjycoreofmqcbnmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbmd4anljb3Jlb2ZtcWNibm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjUyNDYsImV4cCI6MjA4NzQ0MTI0Nn0.iezjpNhH6lKN6jA248jqHrEbu0Lk03-MX8dclqvN2zE';

// This creates the "connection" we will use later
const supabaseClient = createClient(supabaseUrl, supabaseKey);
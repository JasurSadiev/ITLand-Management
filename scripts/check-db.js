
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  console.log("Checking lessons table...");
  const { data: lessonData, error: lessonError } = await supabase.from('lessons').select('*').limit(1);
  if (lessonError) {
    console.error("Error fetching lessons:", lessonError);
  } else if (lessonData && lessonData.length > 0) {
    console.log("Lessons columns:", Object.keys(lessonData[0]));
  } else {
    console.log("No lessons found to check columns.");
  }

  console.log("\nChecking availability_settings table...");
  const { data: settingsData, error: settingsError } = await supabase.from('availability_settings').select('*').limit(1);
  if (settingsError) {
    console.error("Error fetching settings:", settingsError);
  } else if (settingsData && settingsData.length > 0) {
    console.log("Settings columns:", Object.keys(settingsData[0]));
  } else {
    console.log("No settings found to check columns.");
  }
}

checkColumns();

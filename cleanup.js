const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanDB() {
  // Get all documents
  const { data: docs } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  
  const seen = new Set();
  const toDelete = [];
  
  for (const doc of docs) {
    if (doc.status === 'processing' || seen.has(doc.filename)) {
      toDelete.push(doc.id);
    } else {
      seen.add(doc.filename);
    }
  }
  
  if (toDelete.length > 0) {
    console.log('Deleting', toDelete.length, 'documents');
    const { error } = await supabase.from('documents').delete().in('id', toDelete);
    if (error) console.error('Error deleting:', error);
    else console.log('Successfully cleaned up DB');
  } else {
    console.log('No duplicates or stuck processing documents found.');
  }
}
cleanDB();
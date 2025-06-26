
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yazfqrmzxslxspoqyhvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhemZxcm16eHNseHNwb3F5aHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTEyNzcsImV4cCI6MjA2NjA2NzI3N30.xQEwuIRHfHtCdAYe-fgOL4V6E6CWkcJYYpgF5u9ny2o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

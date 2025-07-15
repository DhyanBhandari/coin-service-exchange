#!/usr/bin/env node

/**
 * Fixed Firebase Setup Script for ErthaExchange
 * 
 * This script helps you set up Firebase authentication for your project.
 * Run with: npm run firebase:setup
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer:any) => resolve(answer as string));
  });
}

async function main() {
  console.log('\n🔥 Firebase Authentication Setup for ErthaExchange\n');
  
  console.log('This script will help you configure Firebase authentication.');
  console.log('Make sure you have:');
  console.log('1. Created a Firebase project at https://console.firebase.google.com');
  console.log('2. Enabled Authentication with Email/Password and Google providers');
  console.log('3. Generated a service account key from Project Settings > Service Accounts\n');
  
  const proceed = await question('Do you want to continue? (y/n): ') as string;
  if (proceed.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }

  console.log('\n📋 Please provide your Firebase configuration details:\n');

  // Collect Firebase configuration
  const config: Record<string, string> = {
    // Frontend config
    VITE_FIREBASE_API_KEY: await question('Firebase API Key: '),
    VITE_FIREBASE_AUTH_DOMAIN: await question('Firebase Auth Domain (your-project.firebaseapp.com): '),
    VITE_FIREBASE_PROJECT_ID: await question('Firebase Project ID: '),
    VITE_FIREBASE_STORAGE_BUCKET: await question('Firebase Storage Bucket (your-project.appspot.com): '),
    VITE_FIREBASE_MESSAGING_SENDER_ID: await question('Firebase Messaging Sender ID: '),
    VITE_FIREBASE_APP_ID: await question('Firebase App ID: '),
    
    // Backend config
    FIREBASE_PROJECT_ID: '', // Will be set from project ID
    FIREBASE_PRIVATE_KEY_ID: await question('Firebase Private Key ID (from service account): '),
    FIREBASE_PRIVATE_KEY: await question('Firebase Private Key (paste the entire key with quotes): '),
    FIREBASE_CLIENT_EMAIL: await question('Firebase Client Email (from service account): '),
    FIREBASE_CLIENT_ID: await question('Firebase Client ID (from service account): '),
  };

  // Set backend project ID
  config.FIREBASE_PROJECT_ID = config.VITE_FIREBASE_PROJECT_ID;

  // Get current working directory
  const currentDir = process.cwd();
  console.log(`\n📍 Current directory: ${currentDir}`);

  // Determine correct paths
  let frontendEnvPath, backendEnvPath;
  
  // Check if we're in the root or backend directory
  if (fs.existsSync(path.join(currentDir, 'backend'))) {
    // We're in the root directory
    frontendEnvPath = path.join(currentDir, '.env');
    backendEnvPath = path.join(currentDir, 'backend', '.env');
  } else if (path.basename(currentDir) === 'backend') {
    // We're in the backend directory
    frontendEnvPath = path.join(path.dirname(currentDir), '.env');
    backendEnvPath = path.join(currentDir, '.env');
  } else {
    // Try to detect structure
    frontendEnvPath = path.join(currentDir, '.env');
    backendEnvPath = path.join(currentDir, '.env');
  }

  console.log(`📁 Frontend .env path: ${frontendEnvPath}`);
  console.log(`📁 Backend .env path: ${backendEnvPath}`);

  // Update frontend .env
  try {
    let frontendEnvContent = '';
    
    if (fs.existsSync(frontendEnvPath)) {
      frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
      console.log('📄 Found existing frontend .env file');
    } else {
      console.log('📄 Creating new frontend .env file');
    }

    // Add or update Firebase config in frontend .env
    const frontendFirebaseConfig = `
# Firebase Configuration
VITE_FIREBASE_API_KEY=${config.VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${config.VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${config.VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${config.VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${config.VITE_FIREBASE_APP_ID}
`;

    // Remove existing Firebase config if present
    frontendEnvContent = frontendEnvContent.replace(/# Firebase Configuration[\s\S]*?VITE_FIREBASE_APP_ID=.*?\n/g, '');
    frontendEnvContent += frontendFirebaseConfig;

    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('✅ Updated frontend .env file');
  } catch (error) {
    console.error(`❌ Failed to update frontend .env: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Update backend .env
  try {
    let backendEnvContent = '';
    
    if (fs.existsSync(backendEnvPath)) {
      backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      console.log('📄 Found existing backend .env file');
    } else {
      // Create backend directory if it doesn't exist
      const backendDir = path.dirname(backendEnvPath);
      if (!fs.existsSync(backendDir)) {
        fs.mkdirSync(backendDir, { recursive: true });
        console.log(`📁 Created backend directory: ${backendDir}`);
      }
      console.log('📄 Creating new backend .env file');
    }

    // Add or update Firebase config in backend .env
    const backendFirebaseConfig = `
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=${config.FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY_ID=${config.FIREBASE_PRIVATE_KEY_ID}
FIREBASE_PRIVATE_KEY=${config.FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${config.FIREBASE_CLIENT_EMAIL}
FIREBASE_CLIENT_ID=${config.FIREBASE_CLIENT_ID}
`;

    // Remove existing Firebase config if present
    backendEnvContent = backendEnvContent.replace(/# Firebase Admin SDK Configuration[\s\S]*?FIREBASE_CLIENT_ID=.*?\n/g, '');
    backendEnvContent += backendFirebaseConfig;

    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ Updated backend .env file');
  } catch (error) {
    console.error(`❌ Failed to update backend .env: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`💡 You may need to manually create the backend .env file at: ${backendEnvPath}`);
  }

  // Create backend .env example if it doesn't exist
  const backendEnvExample = path.join(path.dirname(backendEnvPath), '.env.example');
  if (!fs.existsSync(backendEnvExample)) {
    try {
      const exampleContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/erthaexchange

# JWT Configuration (keep for backward compatibility)
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CORS Configuration
FRONTEND_URL=http://localhost:5173
`;

      fs.writeFileSync(backendEnvExample, exampleContent);
      console.log('✅ Created backend .env.example file');
    } catch (error) {
      console.log('⚠️  Could not create .env.example file');
    }
  }

  console.log('\n🎉 Firebase configuration completed!');
  console.log('\nNext steps:');
  console.log('1. Verify your .env files are correctly configured');
  console.log('2. Run database migration:');
  console.log('   cd backend && npm run db:setup-firebase');
  console.log('3. Install dependencies:');
  console.log('   cd backend && npm install');
  console.log('   cd .. && npm install');
  console.log('4. Start backend server: cd backend && npm run dev');
  console.log('5. Start frontend: npm run dev');
  console.log('\n📚 Additional setup:');
  console.log('- Configure Firebase Authentication providers in the Firebase console');
  console.log('- Set up authorized domains for your production deployment');
  console.log('- Test the authentication flow');
  
  rl.close();
}

main().catch(console.error);
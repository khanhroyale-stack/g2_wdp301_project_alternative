/**
 * POST-MERGE SYSTEM HEALTH CHECK
 * 
 * Script kiểm tra tự động các vấn đề phổ biến sau khi merge
 * 
 * Usage: node check-system.js
 */

const fs = require('fs');
const path = require('path');

const issues = [];
const warnings = [];
const success = [];

console.log('🔍 Đang kiểm tra hệ thống sau merge...\n');

// 1. Check critical files exist
console.log('📁 Kiểm tra files quan trọng...');
const criticalFiles = [
  'backend/src/utils/serializers.js',
  'backend/src/controllers/order.controller.js',
  'frontend/src/services/order.service.js',
  'frontend/src/pages/orders/OrderDetail.jsx',
  'frontend/src/pages/orders/CreateOrder.jsx',
  'frontend/src/pages/admin/RevenueReport.jsx',
];

criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    success.push(`✅ ${file} exists`);
  } else {
    issues.push(`❌ Missing critical file: ${file}`);
  }
});

// 2. Check .env file
console.log('🔐 Kiểm tra environment variables...');
const envExample = path.join(__dirname, 'frontend/.env.example');
const envFile = path.join(__dirname, 'frontend/.env');

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  if (!envContent.includes('VITE_GOOGLE_CLIENT_ID')) {
    warnings.push('⚠️  VITE_GOOGLE_CLIENT_ID not found in .env - Google OAuth sẽ không hoạt động');
  } else {
    success.push('✅ VITE_GOOGLE_CLIENT_ID configured');
  }
  
  if (!envContent.includes('VITE_API_URL')) {
    issues.push('❌ VITE_API_URL not found in .env');
  } else {
    success.push('✅ VITE_API_URL configured');
  }
} else {
  warnings.push('⚠️  frontend/.env not found - Copy from .env.example');
}

// 3. Check for merge conflict markers
console.log('🔀 Kiểm tra merge conflicts...');
const searchDirs = ['frontend/src', 'backend/src'];
let conflictFound = false;

function checkConflicts(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules' && file.name !== '.git') {
      checkConflicts(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<<<<<<<') || content.includes('>>>>>>>')) {
        issues.push(`❌ Merge conflict markers found in: ${fullPath}`);
        conflictFound = true;
      }
    }
  });
}

searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    checkConflicts(dir);
  }
});

if (!conflictFound) {
  success.push('✅ No merge conflict markers found');
}

// 4. Check package.json dependencies
console.log('📦 Kiểm tra dependencies...');
const frontendPackage = path.join(__dirname, 'frontend/package.json');

if (fs.existsSync(frontendPackage)) {
  const pkg = JSON.parse(fs.readFileSync(frontendPackage, 'utf8'));
  
  const requiredDeps = [
    '@react-oauth/google',
    'react-hot-toast',
    'react-router-dom',
    'axios'
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      success.push(`✅ ${dep} installed`);
    } else {
      issues.push(`❌ Missing dependency: ${dep}`);
    }
  });
}

// 5. Check backend package.json
const backendPackage = path.join(__dirname, 'backend/package.json');
if (fs.existsSync(backendPackage)) {
  const pkg = JSON.parse(fs.readFileSync(backendPackage, 'utf8'));
  
  const requiredDeps = [
    'express',
    'mongoose',
    'jsonwebtoken',
    'bcryptjs'
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      success.push(`✅ Backend: ${dep} installed`);
    } else {
      issues.push(`❌ Backend missing dependency: ${dep}`);
    }
  });
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 KẾT QUẢ KIỂM TRA');
console.log('='.repeat(60) + '\n');

if (success.length > 0) {
  console.log('✅ SUCCESS (' + success.length + '):\n');
  success.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (' + warnings.length + '):\n');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ ISSUES (' + issues.length + '):\n');
  issues.forEach(msg => console.log('  ' + msg));
  console.log('');
}

// Summary
console.log('='.repeat(60));
if (issues.length === 0) {
  console.log('🎉 HỆ THỐNG TRONG TRẠNG THÁI TỐT!');
  if (warnings.length > 0) {
    console.log('   Có một số warnings nhỏ cần chú ý.');
  }
} else {
  console.log('⚠️  CÓ ' + issues.length + ' VẤN ĐỀ CẦN FIX NGAY!');
}
console.log('='.repeat(60) + '\n');

process.exit(issues.length > 0 ? 1 : 0);

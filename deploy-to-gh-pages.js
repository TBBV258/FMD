import fs from 'fs-extra';
import path from 'path';

async function deployToGitHubPages() {
  try {
    console.log('🚀 Starting deployment to GitHub Pages...');
    
    // Copy dist contents to root
    await fs.copy('./dist', './', { overwrite: true });
    console.log('✅ Copied dist contents to root directory');
    
    // Remove dist folder from root (cleanup)
    await fs.remove('./dist');
    console.log('✅ Cleaned up dist folder');
    
    console.log('🎉 Deployment ready! Commit and push to GitHub Pages.');
    console.log('📝 Next steps:');
    console.log('   1. git add .');
    console.log('   2. git commit -m "Deploy to GitHub Pages"');
    console.log('   3. git push origin main');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployToGitHubPages();

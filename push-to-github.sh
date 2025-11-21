#!/bin/bash

echo "🚀 TinyLink - Push to GitHub"
echo "============================"
echo ""

# Check if git remote exists
if git remote | grep -q "origin"; then
    echo "✅ Remote 'origin' already configured"
    git remote -v
    echo ""
    read -p "Do you want to push to this remote? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "❌ Aborted"
        exit 1
    fi
else
    echo "📝 No remote repository configured"
    echo ""
    echo "Please enter your GitHub repository URL:"
    echo "Example: https://github.com/YOUR_USERNAME/tinylink.git"
    echo "Or SSH: git@github.com:YOUR_USERNAME/tinylink.git"
    echo ""
    read -p "Repository URL: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo "❌ No URL provided. Aborted."
        exit 1
    fi
    
    echo ""
    echo "Adding remote repository..."
    git remote add origin "$repo_url"
    
    if [ $? -eq 0 ]; then
        echo "✅ Remote added successfully"
    else
        echo "❌ Failed to add remote"
        exit 1
    fi
fi

echo ""
echo "📤 Pushing to GitHub..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Your code is now on GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Visit your repository on GitHub"
    echo "2. Deploy to Vercel: https://vercel.com"
    echo "3. Set up your database (Neon/Supabase)"
    echo "4. Add environment variables in Vercel"
    echo "5. Run: npx prisma db push"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Check your GitHub credentials"
    echo "2. Verify repository URL is correct"
    echo "3. Make sure you have push access"
    echo "4. Try: git push -f origin main (use with caution)"
    echo ""
    echo "📖 See GITHUB_DEPLOY_INSTRUCTIONS.md for help"
fi

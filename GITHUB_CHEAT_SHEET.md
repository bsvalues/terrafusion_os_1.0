# 🚀 GitHub Cheat Sheet for Terrafusion Development

## 🎯 **What is GitHub?**
GitHub is like a "cloud backup" for your code that also tracks every change you make. Think of it as a super-powered version control system.

## 📚 **Essential Concepts**

### **Repository (Repo)**
- Your project folder that's connected to GitHub
- Contains all your code, files, and change history

### **Commit**
- A "snapshot" of your code at a specific time
- Like saving a game - you can go back to any save point

### **Push/Pull**
- **Push**: Send your changes to GitHub (backup)
- **Pull**: Get latest changes from GitHub (update)

### **Branch**
- A separate copy of your code for experiments
- Master branch = your main, working code

## 🛠️ **Daily Commands (Copy & Paste)**

### **Start Your Day**
```bash
git pull origin master
```
*Translation: "Get the latest code from GitHub"*

### **Save Your Work**
```bash
git add .
git commit -m "What I changed today"
git push origin master
```
*Translation: "Backup my work to GitHub"*

### **Check What's Happening**
```bash
git status
```
*Translation: "What files did I change?"*

### **See Recent Changes**
```bash
git log --oneline -5
```
*Translation: "Show me the last 5 things I saved"*

## 🚨 **Emergency Commands**

### **Undo Last Change**
```bash
git reset --hard HEAD~1
```
*Translation: "Go back to my last save point"*

### **Undo Specific File**
```bash
git checkout -- filename
```
*Translation: "Undo changes to this specific file"*

### **See What Changed**
```bash
git diff
```
*Translation: "Show me exactly what I changed"*

## 🎮 **Using the Helper Script**

Instead of typing commands, just run:
```bash
scripts/git-workflow.bat
```

This gives you a menu to:
1. **Start Day** - Get latest code
2. **Save Work** - Backup your changes
3. **Check Status** - See what's happening
4. **Undo Change** - Go back if something breaks

## 📱 **GitHub Desktop Alternative**

If you prefer a visual interface:
1. Download GitHub Desktop from https://desktop.github.com/
2. Sign in with your GitHub account
3. Clone your repository
4. Use the visual interface instead of commands

## 🎯 **Best Practices**

### **✅ DO:**
- Save your work every day (commit + push)
- Write clear commit messages
- Pull latest code before starting work
- Test your code before pushing

### **❌ DON'T:**
- Commit broken code
- Forget to pull before starting work
- Use vague commit messages like "fix stuff"
- Panic if something goes wrong - GitHub has your back!

## 🆘 **When Things Go Wrong**

### **"I broke something!"**
```bash
git reset --hard HEAD~1  # Go back to last working version
```

### **"I lost my changes!"**
```bash
git log --oneline          # Find the commit you want
git checkout <commit-id>   # Go back to that version
```

### **"Git is confusing me!"**
```bash
git status                 # See what's happening
git help <command>         # Get help on any command
```

## 🎉 **Remember**
- **GitHub is your friend** - it saves your work automatically
- **Commit often** - small, frequent saves are better than big, rare ones
- **Don't panic** - you can always go back to a working version
- **Use the helper script** - it makes everything easier!

## 🚀 **Quick Start Every Day**
1. Run `scripts/git-workflow.bat`
2. Choose option 1 (Start Day)
3. Do your work
4. Choose option 2 (Save Work)
5. Repeat tomorrow!

**GitHub makes you a better developer by never losing your work!** ✨

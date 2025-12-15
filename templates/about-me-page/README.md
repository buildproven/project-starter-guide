# About Me Page Template

A modern, responsive personal portfolio website template perfect for developers, designers, and professionals.

**Complexity Level:** 1 | **Timeline:** 1-2 days | **Tech Stack:** HTML5 + CSS3 + Vanilla JavaScript

> Need the one-page checklist? Use the steps below as your quick start.

## Features

- 🎨 **Modern Design** - Clean, professional layout with smooth animations
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Optimized for speed with efficient code
- 🎯 **SEO Friendly** - Proper meta tags and semantic HTML
- 🔄 **Interactive Elements** - Smooth scrolling, hover effects, and animations
- 📧 **Contact Form** - Built-in contact form with validation
- 🎭 **Customizable** - Easy to modify colors, content, and layout

## Quick Start

1. **Download the template**
2. **Add your images** to the `assets/` folder (see assets/README.md)
3. **Customize the content** in `index.html` - replace all `[Your ...]` placeholders
4. **Setup Quality Automation** (Recommended)
   ```bash
   # Initialize as npm project for quality tools
   npm init -y

   # Add comprehensive quality automation
   npx create-qa-architect@latest
   npm install && npm run prepare

   # Now you have: ESLint, Prettier, security scanning, pre-commit hooks
   npm run lint        # Validate HTML/CSS/JS
   npm run format      # Auto-format code
   npm run security:audit  # Check for vulnerabilities
   ```
5. **Update colors/styling** in `styles.css` if desired
6. **Deploy** to your hosting platform

## File Structure

```
about-me-page/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Interactive functionality
├── README.md           # This file
└── assets/
    ├── README.md       # Asset instructions
    ├── profile.jpg     # Your profile photo
    ├── project1.jpg    # Project screenshots
    ├── project2.jpg
    ├── project3.jpg
    └── resume.pdf      # Your resume
```

## Customization

### 1. Basic Information
Edit `index.html` to replace:
- `[Your Name]` with your actual name
- `[Your Title/Role]` with your job title
- `[Your Focus]` with your area of expertise
- All social media URLs and email addresses

### 2. Content Sections
- **About:** Replace placeholder paragraphs and update skills
- **Experience:** Update job titles, companies, dates, and achievements
- **Projects:** Change project names, descriptions, and technology tags

### 3. Styling
Edit CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #2563eb;    /* Main brand color */
    --accent-color: #06b6d4;     /* Secondary accent */
}
```

## Deployment Options

- **Netlify** - Free with custom domain support
- **Vercel** - Excellent performance and free tier
- **GitHub Pages** - Free hosting directly from GitHub repo

## License

Free to use for personal and commercial projects.

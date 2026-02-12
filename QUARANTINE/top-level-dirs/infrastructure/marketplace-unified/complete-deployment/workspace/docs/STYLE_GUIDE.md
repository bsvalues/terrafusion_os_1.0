# Terrafusion Documentation Style Guide

This style guide ensures consistency, clarity, and professionalism across all Terrafusion documentation. Follow these guidelines when creating or updating documentation.

## 📝 Writing Principles

### 1. Clarity First
- Write for your audience's knowledge level
- Use simple, direct language
- Avoid jargon unless necessary (and define when used)
- One concept per sentence, one topic per paragraph

### 2. User-Focused
- Start with what the user wants to accomplish
- Provide context before diving into details
- Include practical examples
- Anticipate common questions

### 3. Scannable Structure
- Use clear headings and subheadings
- Break up long text with lists and code blocks
- Use visual elements (diagrams, screenshots) appropriately
- Include table of contents for long documents

---

## 🎯 Document Structure

### Standard Document Template
```markdown
# Document Title

Brief description of what this document covers and who it's for.

## 🎯 Overview (optional for short docs)

High-level summary of the topic.

## 📋 Prerequisites (if applicable)

- List required knowledge
- Required tools or setup
- Links to prerequisite reading

## Main Content Sections

### Section 1: Getting Started
Step-by-step instructions with examples.

### Section 2: Advanced Topics
More complex scenarios and use cases.

## 🔍 Troubleshooting (if applicable)

Common issues and solutions.

## 📚 Additional Resources

- Related documentation
- External links
- Further reading

---

*Document last updated: [Date]*
```

### Required Elements

#### Document Header
Every document must include:
- **Title**: Clear, descriptive H1 heading
- **Description**: Brief summary of content and audience
- **Emoji Icons**: Consistent icons for visual navigation
- **Last Updated**: Date of last modification

#### Table of Contents
For documents over 500 words:
```markdown
## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
```

#### Prerequisites Section
When applicable:
```markdown
## 📋 Prerequisites

Before following this guide, ensure you have:
- Node.js 18+ installed
- Docker and Docker Compose
- Basic understanding of REST APIs
- Terrafusion account with API access
```

---

## ✍️ Writing Style

### Tone and Voice
- **Professional yet approachable**: Confident but not arrogant
- **Clear and concise**: Eliminate unnecessary words
- **Helpful and supportive**: Guide users to success
- **Consistent**: Use same terms throughout documentation

### Language Guidelines

#### Use Active Voice
❌ **Avoid**: "The API will be called by the client"
✅ **Use**: "The client calls the API"

#### Write in Second Person
❌ **Avoid**: "One should configure the database"
✅ **Use**: "You should configure the database"

#### Be Specific and Concrete
❌ **Avoid**: "This might cause some issues"
✅ **Use**: "This will cause a 500 Internal Server Error"

#### Use Parallel Structure
❌ **Avoid**: 
- Install Node.js
- Configuration of environment variables
- Starting the server

✅ **Use**:
- Install Node.js
- Configure environment variables
- Start the server

### Technical Writing Best Practices

#### Code and Commands
- Use consistent code formatting
- Include complete, runnable examples
- Explain what code does, not just how
- Provide context for commands

```bash
# Good: Includes context and explanation
# Install project dependencies
npm install

# Start development server on port 3000
npm run dev
```

#### Error Messages
- Include exact error messages
- Provide step-by-step solutions
- Explain why the error occurs
- Link to related documentation

---

## 🎨 Formatting Standards

### Markdown Guidelines

#### Headings
- Use consistent heading hierarchy
- Include emoji icons for main sections
- Keep headings descriptive but concise

```markdown
# Main Title (H1) - Only one per document
## 🎯 Major Section (H2) - With emoji
### Subsection (H3)
#### Minor Subsection (H4)
```

#### Text Formatting
- **Bold** for UI elements, important terms, emphasis
- *Italic* for filenames, variable names, book titles
- `Code` for inline code, commands, parameters
- ~~Strikethrough~~ for deprecated features

#### Lists
Use consistent formatting:

**Unordered Lists:**
```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

**Ordered Lists:**
```markdown
1. First step
2. Second step
   1. Sub-step
   2. Another sub-step
3. Third step
```

#### Code Blocks
Always specify language for syntax highlighting:

```markdown
```bash
# Shell commands
npm install terrafusion-sdk
```

```javascript
// JavaScript code
const client = new Terrafusion({
  apiKey: 'your-api-key'
});
```

```json
{
  "property_id": "prop_123",
  "valuation": {
    "estimate": 575000,
    "confidence": 0.87
  }
}
```
```

#### Tables
Use consistent table formatting:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

For complex tables, consider alternatives like definition lists:

```markdown
**Property Type**
: The classification of the property (residential, commercial, land)

**Square Footage**
: Total livable area in square feet

**Lot Size**
: Property lot size in acres
```

---

## 🎭 Visual Elements

### Emoji Usage
Use emojis consistently for visual navigation:

#### Section Icons
- 🎯 Overview, objectives, goals
- 📋 Prerequisites, requirements
- 🚀 Getting started, quick start
- 🏗️ Architecture, structure
- 🔧 Configuration, settings
- 📊 Analytics, metrics, data
- 🔐 Security, authentication
- 🌐 API, networking
- 📱 Mobile, responsive
- 🧪 Testing, experiments
- 🔍 Troubleshooting, debugging
- 📚 Resources, references
- ⚠️ Warnings, important notes
- ✅ Success, completion
- ❌ Errors, failures
- 🎓 Training, education
- 🛠️ Tools, utilities

#### Status Indicators
- ✅ Completed, working, recommended
- ⚠️ Warning, caution, deprecated  
- ❌ Error, broken, not recommended
- 🚧 Work in progress, under construction
- 🆕 New feature, recently added
- 📈 Improved, enhanced

### Callout Boxes
Use consistent callout formatting:

```markdown
> **💡 Tip**: Use environment variables to manage API keys securely.

> **⚠️ Warning**: This operation will delete all data permanently.

> **📝 Note**: The free tier is limited to 100 API calls per month.

> **🚨 Important**: Always backup your database before major updates.
```

### Screenshots and Diagrams
- Include alt text for accessibility
- Use consistent styling and annotations
- Keep images up to date with current UI
- Optimize for web (compressed, appropriate format)

```markdown
![Terrafusion Dashboard showing property search results](./images/dashboard-search.png)
```

---

## 🔗 Linking and Navigation

### Internal Links
Use relative paths for internal documentation:

```markdown
See also: [API Authentication](../api/authentication.md)
For more details: [Installation Guide](./installation.md)
```

### External Links
Always open in new tab and indicate external:

```markdown
[Official Docker Documentation](https://docs.docker.com) (external)
```

### Cross-References
Link related sections and documents:

```markdown
## Related Topics
- [User Authentication](../security/auth.md)
- [API Rate Limiting](../api/rate-limiting.md)
- [Error Handling Best Practices](../developer/error-handling.md)
```

---

## 📊 Code Examples

### Complete Examples
Provide working, tested examples:

```javascript
// Complete property search example
const Terrafusion = require('@terrafusion/sdk');

const client = new Terrafusion({
  apiKey: process.env.TERRAFUSION_API_KEY,
  environment: 'production'
});

async function searchProperties() {
  try {
    const results = await client.properties.search({
      location: 'Seattle, WA',
      propertyType: 'residential',
      priceRange: {
        min: 300000,
        max: 700000
      },
      bedrooms: { min: 2, max: 4 }
    });
    
    console.log(`Found ${results.total} properties`);
    return results;
  } catch (error) {
    console.error('Search failed:', error.message);
    throw error;
  }
}

// Usage
searchProperties()
  .then(results => console.log(results))
  .catch(error => console.error(error));
```

### Example Annotations
Explain complex code:

```javascript
// Initialize the Terrafusion client with your API credentials
const client = new Terrafusion({
  apiKey: process.env.TERRAFUSION_API_KEY,  // Your API key from dashboard
  environment: 'production'                  // Use 'sandbox' for testing
});

// Search for properties with specific criteria
const searchCriteria = {
  location: 'Seattle, WA',        // City, state, or ZIP code
  propertyType: 'residential',    // 'residential', 'commercial', or 'land'
  priceRange: {
    min: 300000,                  // Minimum price filter
    max: 700000                   // Maximum price filter
  }
};
```

### Error Handling Examples
Always show proper error handling:

```javascript
try {
  const property = await client.properties.get('prop_123');
  console.log('Property found:', property);
} catch (error) {
  if (error.code === 'PROPERTY_NOT_FOUND') {
    console.log('Property does not exist');
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('Rate limit exceeded, try again later');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 📋 Quality Checklist

Before publishing any documentation, verify:

### Content Quality
- [ ] Clear purpose and audience identified
- [ ] All instructions tested and verified
- [ ] Examples are complete and working
- [ ] Screenshots are current and relevant
- [ ] Links work and go to correct destinations
- [ ] Grammar and spelling checked

### Structure and Format
- [ ] Consistent heading hierarchy
- [ ] Proper markdown formatting
- [ ] Appropriate use of emojis and callouts
- [ ] Table of contents for long documents
- [ ] Consistent code formatting
- [ ] Alt text for images

### Accessibility
- [ ] Clear, descriptive headings
- [ ] Alternative text for images
- [ ] High contrast for readability
- [ ] Logical document structure
- [ ] Links are descriptive (not "click here")

### Maintenance
- [ ] Last updated date included
- [ ] Version-specific information noted
- [ ] Deprecation notices where applicable
- [ ] Contact information current

---

## 🔄 Review Process

### Peer Review
All documentation should be reviewed by:
1. **Technical reviewer**: Verifies accuracy and completeness
2. **Editor**: Checks grammar, style, and clarity
3. **User tester**: Tests instructions from user perspective

### Review Criteria
- **Accuracy**: Technical information is correct
- **Completeness**: All necessary information included
- **Clarity**: Easy to understand and follow
- **Consistency**: Follows style guide
- **Usefulness**: Helps users accomplish their goals

### Update Schedule
- **Critical documentation**: Review monthly
- **API documentation**: Review with each release
- **User guides**: Review quarterly
- **General documentation**: Review semi-annually

---

## 🛠️ Tools and Templates

### Writing Tools
- **Grammar**: Grammarly, Hemingway Editor
- **Markdown**: Typora, Mark Text, VS Code
- **Screenshots**: CleanShot X, Snagit
- **Diagrams**: Lucidchart, Draw.io, Mermaid

### Document Templates
Available templates:
- [API Endpoint Documentation](./templates/api-endpoint.md)
- [Feature Guide Template](./templates/feature-guide.md)
- [Tutorial Template](./templates/tutorial.md)
- [Troubleshooting Guide](./templates/troubleshooting.md)
- [Release Notes Template](./templates/release-notes.md)

### Automation
- Automated link checking
- Spell check CI/CD integration
- Screenshot comparison testing
- Documentation freshness monitoring

---

## 📞 Documentation Team

### Roles and Responsibilities

**Documentation Manager**
- Overall documentation strategy
- Style guide maintenance
- Quality standards enforcement

**Technical Writers**
- Create and maintain documentation
- Work with engineering teams
- User experience focus

**Editors**
- Copy editing and proofreading
- Style consistency
- Publication workflow

**Subject Matter Experts**
- Technical accuracy review
- Feature documentation input
- User scenario validation

### Contact Information
- **Documentation Team**: docs@terrafusion.ai
- **Style Guide Questions**: style@terrafusion.ai
- **Technical Reviews**: tech-review@terrafusion.ai

---

## 📈 Metrics and Improvement

### Documentation Metrics
We track:
- **Usage analytics**: Page views, time on page
- **User feedback**: Ratings, comments, support tickets
- **Search metrics**: Internal search queries, results
- **Maintenance metrics**: Update frequency, freshness

### Continuous Improvement
- Monthly documentation review meetings
- Quarterly user feedback analysis
- Annual style guide updates
- Regular usability testing

---

*This style guide is a living document. Suggest improvements by contacting the documentation team or submitting a pull request.*

**Last Updated**: August 3, 2025
**Version**: 3.0.5
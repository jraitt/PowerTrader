# PowerTrader Project Requirements

## 1. Create a PRD.md to drive an LLM coding agent

For a web page that for a small business of buying and selling small engine related machinery ie: ATV's, Snowmobiles, Lawn tractors, utility trailers. The app will be used for tracking bought and sold items and also listing things currently for sale. I want a clean, modern beautiful app.

### Each Item should have:
- Category: ATV, Snowmobile, Trailer, Small Engine
- Manufacturer
- Model
- Condition (Scale 1-10)
- Asking Price
- Final Price
- Sold Price
- Location (Location where the item was bought)

### The user should be able to easily create, update, delete items

### The user can add items by:
- Manually add items including multiple photos
- Uploading a photo (use AI to analyze the photo and populate items)
- Provide a URL from an existing item on facebook marketplace or craigslist. Gemini AI will extract all the photos, description and other information and populate the database

### The main page should have a hero section with a photo, the users Logo and "PowerTrader Buy / Sell the East"

### Technical Requirements:
- This should be a Docker first design, with a single Docker container using port 3040. Development and production will be done in Docker and the differences should be solely managed using separate .env files for development vs. production
- Use Supabase for the database
- Use Clerk for user management
- Use Gemini 2.5 Flash for AI

## 2. Create a CLAUDE.md file from the PRD that will guide future Claude Code sessions on this project

## 3. Create a PLANNING.md file that includes vision, architecture, technology stack, and required tools list for this app

## 4. Create a TASKS.md file with bullet points tasks divided into milestones for building this app
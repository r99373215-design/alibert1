# Albert Shop Telegram Bot

This project contains a minimal Telegram bot that can:

- show the catalog
- send product details
- send order requests to the owner
- work as a shop bot frontend for the storefront

## Setup

1. Install dependencies:
   npm install
2. Copy the environment file:
   copy .env.example .env
3. Add your Telegram bot token to `.env`:
   BOT_TOKEN=your_bot_token
4. Start the bot:
   npm start

## Commands

- `/start` — welcome screen
- `/catalog` — show all products
- `/help` — help and commands
- `/support` — redirect to the shop owner
- `/order <id>` — prepare a quick order message

## Owner contact

The bot is configured to contact: `@xqwex0`

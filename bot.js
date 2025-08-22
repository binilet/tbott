const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🔗 Your URLs and Local Assets
const WEBAPP_URL = "https://hagere-online.com";
// Local logo paths - choose one based on your file type
const LOCAL_LOGO_PNG = path.join(__dirname, 'assets', 'logo.png');


// Bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- Professional Menu Setup ---
const setupBotMenu = async () => {
  try {
    // Set bot commands for the menu button
    await bot.setMyCommands([
      { command: "start", description: "🚀 እንኳን ደህና መጡ" },
      { command: "play", description: "🎮 ወደ ጌም ይሂዱ" },
      { command: "rules", description: "📋 ህግጋት" },
      //{ command: "stats", description: "📊 Your Game Statistics" },
      { command: "support", description: "💬 Contact Support" },
      { command: "about", description: "ℹ️ ስለ እኛ" }
    ]);

    // Set bot description
    await bot.setMyDescription(
      "🎯 Welcome to Hagere Bingo! The most exciting online bingo experience. " +
      "Play live games, win real prizes, and enjoy the thrill of bingo with players worldwide!"
    );

    // Set bot short description
    await bot.setMyShortDescription("🎮 Professional Online Bingo Game");

    console.log("✅ Bot menu and descriptions set successfully!");
  } catch (error) {
    console.error("❌ Error setting up bot menu:", error);
  }
};


async function sendLogo(bot, chatId, userName) {
  try {
    // Method 1: Send local PNG image (BEST - displays as photo)
    if (fs.existsSync(LOCAL_LOGO_PNG)) {
      await bot.sendPhoto(chatId, LOCAL_LOGO_PNG, {
        caption: `🎯 *እንኳን ወደ ሃገሬ ጌምስ መጡ, ${userName}!*\n\n` +
                 `🌟 *አጓጊ እና አስደሳች የቢንጎ ጨዋታዎች መገኛ*\n\n` +
                 `በሽልማት ለመንበሽበሽ ተዘጋጅተዋል?`,
        parse_mode: "Markdown"
      });
      return true; // Logo sent successfully
    } 
    else {
      // No logo file found
      return false;
    }
  } catch (error) {
    console.error("Error sending logo:", error);
    return false; // Failed to send logo
  }
}

// --- Enhanced Command Handlers ---

// 1. Professional Start Command with Logo and Mini App
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "Player";

  // Try to send logo first
  const logoSent = await sendLogo(bot, chatId, userName);
  
  // If logo wasn't sent, send text-based welcome
  if (!logoSent) {
    const logoMessage = `
╔══════════════════════════════════╗
║          🎯 ሃገሬ ቢንጎ          
╚══════════════════════════════════╝

🌟 *እንኳን በደህና መጡ ${userName}!*

🎮 *Ready for the most exciting bingo experience?*
💰 *Win real prizes and compete with players worldwide!*

Let's get you started on your winning journey!`;

    await bot.sendMessage(chatId, logoMessage, {
      parse_mode: "Markdown"
    });
  }

  // Continue with your menu buttons...
  const mainMenuKeyboard = {
        inline_keyboard: [
          [
            { 
              text: "🚀 Launch Game", 
              web_app: { url: WEBAPP_URL } 
            }
          ],
          [
            { text: "📋 How to Play", callback_data: "rules" },
            //{ text: "📊 My Stats", callback_data: "stats" }
          ],
          [
            { text: "🎁 Bonuses", callback_data: "bonuses" },
            { text: "💬 Support", callback_data: "support" }
          ]
        ]
      };

  await bot.sendMessage(
    chatId,
    `🎮 ምን ማድረግ ይፈልጋሉ ?                                          .`,
    {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard
    }
  );
});

// 2. Direct Play Command
bot.onText(/\/play/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(
      chatId,
      `🎯 *Ready to Play Hagere Bingo?*\n\n` +
      `🎮 Click the button below to launch the game instantly!\n\n` +
      `💡 *Pro Tip:* Make sure you have a stable internet connection for the best gaming experience.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "🚀 Launch Hagere Bingo", 
                web_app: { url: WEBAPP_URL } 
              }
            ],
            [
              { text: "📋 Quick Rules", callback_data: "quick_rules" },
              { text: "🔙 Back to Menu", callback_data: "main_menu" }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error("Error in /play command:", error);
    bot.sendMessage(chatId, "❌ Unable to launch game. Please try again.");
  }
});

// 3. Rules Command
bot.onText(/\/rules/, (msg) => {
  const chatId = msg.chat.id;
  
  const rulesMessage = `📋 *HAGERE BINGO - GAME RULES*\n\n` +
    `🎯 **Objective:**\nBe the first to complete a winning pattern on your bingo card!\n\n` +
    `🎮 **How to Play:**\n` +
    `1️⃣ Purchase your bingo cards\n` +
    `2️⃣ Wait for the game to start\n` +
    `3️⃣ Numbers will be called automatically\n` +
    `4️⃣ Mark matching numbers on your card\n` +
    `5️⃣ Shout "BINGO" when you complete a pattern!\n\n` +
    `🏆 **Winning Patterns:**\n` +
    `• Full House (all numbers)\n` +
    `• Lines (horizontal, vertical, diagonal)\n` +
    `• Corners & Special patterns\n\n` +
    `💰 **Prizes:**\nWin real money based on the game type and number of players!`;

  bot.sendMessage(chatId, rulesMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🚀 Play Now", web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: "🔙 Back to Menu", callback_data: "main_menu" }
        ]
      ]
    }
  });
});

// 4. Stats Command
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "Player";
  
  // This would typically fetch real data from your database
  const statsMessage = `📊 *${userName}'s Game Statistics*\n\n` +
    `🎮 **Games Played:** Loading...\n` +
    `🏆 **Games Won:** Loading...\n` +
    `💰 **Total Winnings:** Loading...\n` +
    `🎯 **Win Rate:** Loading...\n` +
    `⭐ **Best Streak:** Loading...\n\n` +
    `📈 *Play more games to see your detailed statistics!*`;

  bot.sendMessage(chatId, statsMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🚀 Play More", web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: "🔙 Back to Menu", callback_data: "main_menu" }
        ]
      ]
    }
  });
});

// 5. Support Command
bot.onText(/\/support/, (msg) => {
  const chatId = msg.chat.id;
  
  const supportMessage = `💬 *HAGERE BINGO SUPPORT*\n\n` +
    `We're here to help! Choose how you'd like to get support:\n\n` +
    `📧 **Email:** support@hagere-online.com\n` +
    `⏰ **Response Time:** Within 24 hours\n` +
    `🌍 **Available:** 24/7 Support\n\n` +
    `**Common Issues:**\n` +
    `• Payment problems\n` +
    `• Game technical issues\n` +
    `• Account questions\n` +
    `• Prize claims`;

  bot.sendMessage(chatId, supportMessage, {
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "💬 Join Support Group", url: "https://t.me/binilet" }
      ],
      [
        { text: "🔙 Back to Menu", callback_data: "main_menu" }
      ]
    ]
  }
});
});

// 6. About Command
bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  
  const aboutMessage = `ℹ️ *ABOUT HAGERE BINGO*\n\n` +
    `🎯 **The Ultimate Online Bingo Experience**\n\n` +
    `🌟 **Features:**\n` +
    `• Live multiplayer games\n` +
    `• Real money prizes\n` +
    `• Multiple game variations\n` +
    `• Secure payments\n` +
    `• 24/7 customer support\n\n` +
    `🏆 **Why Choose Hagere Bingo?**\n` +
    `✅ Licensed and regulated\n` +
    `✅ Fast payouts\n` +
    `✅ Fair gameplay\n` +
    `✅ Mobile optimized\n\n` +
    `🎮 **Version:** 2.0\n` +
    `🌐 **Website:** hagere-online.com`;

  bot.sendMessage(chatId, aboutMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🚀 Start Playing", web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: "🌐 Visit Website", url: WEBAPP_URL }
        ]
      ]
    }
  });
});

// --- Callback Query Handlers ---
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  // Answer the callback query to remove loading state
  await bot.answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case 'main_menu':
      // Edit message to show main menu
      const mainMenuKeyboard = {
        inline_keyboard: [
          [
            { 
              text: "🚀 Launch Game", 
              web_app: { url: WEBAPP_URL } 
            }
          ],
          [
            { text: "📋 How to Play", callback_data: "rules" },
            //{ text: "📊 My Stats", callback_data: "stats" }
          ],
          [
            { text: "🎁 Bonuses", callback_data: "bonuses" },
            { text: "💬 Support", callback_data: "support" }
          ]
        ]
      };

      await bot.editMessageText(
        `🎮 *Choose your action:*\n\n` +
        `• **Launch Game** - Start playing immediately\n` +
        `• **How to Play** - Learn the rules\n` +
        `• **My Stats** - View your progress\n` +
        `• **Bonuses** - Check available rewards\n` +
        `• **Support** - Get help when needed`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: mainMenuKeyboard
        }
      );
      break;

    case 'rules':
      bot.sendMessage(chatId, '/rules');
      break;

    case 'stats':
      bot.sendMessage(chatId, '/stats');
      break;

    case 'support':
      bot.sendMessage(chatId, '/support');
      break;

    case 'bonuses':
      await bot.sendMessage(
        chatId,
        `🎁 *AVAILABLE BONUSES*\n\n` +
        `🆕 **Welcome Bonus:** 100% match on first deposit\n` +
        `🎯 **Daily Login:** Free tickets every day\n` +
        `🏆 **Win Streak:** Bonus multipliers\n` +
        `👥 **Referral:** Invite friends, earn rewards\n\n` +
        `💡 *Log in daily to maximize your bonuses!*`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🚀 Claim Bonuses", web_app: { url: WEBAPP_URL } }
              ],
              [
                { text: "🔙 Back to Menu", callback_data: "main_menu" }
              ]
            ]
          }
        }
      );
      break;

    case 'quick_rules':
      await bot.sendMessage(
        chatId,
        `⚡ *QUICK START GUIDE*\n\n` +
        `1️⃣ Buy bingo cards\n` +
        `2️⃣ Wait for game start\n` +
        `3️⃣ Mark called numbers\n` +
        `4️⃣ Complete patterns to win!\n\n` +
        `🎯 *Ready to play?*`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🚀 Launch Game", web_app: { url: WEBAPP_URL } }
              ]
            ]
          }
        }
      );
      break;
  }
});

// --- Web App Data Handler ---
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app.data);
  
  // Handle data received from your web app
  console.log('Received web app data:', data);
  
  // Send confirmation message
  bot.sendMessage(
    chatId,
    `🎮 *Game Update Received!*\n\nThanks for playing Hagere Bingo!`,
    { parse_mode: "Markdown" }
  );
});

// --- Enhanced Error Handlers ---
bot.on("polling_error", (err) => {
  console.error("🚨 Polling error:", err.message);
});

bot.on("error", (err) => {
  console.error("🚨 Bot error:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
  process.exit(1);
});

// --- Initialize Bot ---
const initializeBot = async () => {
  try {
    await setupBotMenu();
    console.log("🤖 Hagere Bingo Bot is running professionally!");
    console.log("✨ Features enabled:");
    console.log("   • Logo display on start");
    console.log("   • Professional menu commands");
    console.log("   • Mini app integration");
    console.log("   • Interactive buttons");
    console.log("   • Error handling");
  } catch (error) {
    console.error("❌ Failed to initialize bot:", error);
  }
};

// Start the bot
initializeBot();
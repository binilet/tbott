const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🔗 Your URLs and Local Assets
const WEBAPP_URL = "https://hagere-online.com";
const ADMIN_PANEL_URL = "https://hagere-online.com/admin"; // Your admin panel URL
const LOCAL_LOGO_PNG = path.join(__dirname, 'assets', 'logo.png');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Bot token and admin IDs from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [];

const bot = new TelegramBot(token, { polling: true });

// 📊 User Management System
const ensureDataDirectory = () => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadUsers = () => {
  ensureDataDirectory();
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading users:', error);
      return {};
    }
  }
  return {};
};

const saveUsers = (users) => {
  ensureDataDirectory();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

const addUser = (userId, userData) => {
  const users = loadUsers();
  users[userId] = {
    ...users[userId],
    ...userData,
    lastInteraction: new Date().toISOString()
  };
  saveUsers(users);
};

// 🔐 Admin Check Middleware
const isAdmin = (userId) => {
  return ADMIN_IDS.includes(userId);
};

// --- Professional Menu Setup ---
const setupBotMenu = async () => {
  try {
    await bot.setMyCommands([
      { command: "start", description: "🚀 እንኳን ደህና መጡ" },
      { command: "play", description: "🎮 ወደ ጌም ይሂዱ" },
      { command: "rules", description: "📋 ህግጋት" },
      { command: "support", description: "💬 Contact Support" },
      { command: "about", description: "ℹ️ ስለ እኛ" }
    ]);

    await bot.setMyDescription(
      "🎯 እንኳን ወደ ሃገሬ ቢንጎ ጌምስ በሰላም መጡ። አጓጊ ጨዋታዎችን እየተጫወቱ ያሸንፉ!"
    );

    await bot.setMyShortDescription("🎮 ሃገሬ ጌምስ");

    console.log("✅ Bot menu and descriptions set successfully!");
  } catch (error) {
    console.error("❌ Error setting up bot menu:", error);
  }
};

async function sendLogo(bot, chatId, userName) {
  try {
    if (fs.existsSync(LOCAL_LOGO_PNG)) {
      await bot.sendPhoto(chatId, LOCAL_LOGO_PNG, {
        caption: `🎯 *እንኳን ወደ ሃገሬ ጌምስ መጡ, ${userName}!*\n\n` +
                 `🌟 *አጓጊ እና አስደሳች የቢንጎ ጨዋታዎች መገኛ*\n\n` +
                 `በሽልማት ለመንበሽበሽ ተዘጋጅተዋል?`,
        parse_mode: "Markdown"
      });
      return true;
    } 
    return false;
  } catch (error) {
    console.error("Error sending logo:", error);
    return false;
  }
}

// 📢 BROADCASTING SYSTEM

// Admin command to access broadcasting panel
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "❌ Unauthorized. This command is for administrators only.");
    return;
  }

  await bot.sendMessage(
    chatId,
    `👨‍💼 *ADMIN PANEL*\n\n` +
    `Welcome, Admin! Choose an option:\n\n` +
    `📢 *Broadcast* - Send messages to all users\n` +
    `📊 *Stats* - View bot statistics\n` +
    `🌐 *Web Panel* - Open full admin panel`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📢 Create Broadcast", callback_data: "admin_broadcast" }
          ],
          [
            { text: "📊 View Statistics", callback_data: "admin_stats" }
          ],
          [
            { text: "🌐 Open Web Panel", web_app: { url: ADMIN_PANEL_URL } }
          ]
        ]
      }
    }
  );
});

// Broadcast statistics
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return;
  }

  const users = loadUsers();
  const userCount = Object.keys(users).length;
  const activeUsers = Object.values(users).filter(u => {
    const lastInteraction = new Date(u.lastInteraction);
    const daysSince = (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  await bot.sendMessage(
    chatId,
    `📊 *BOT STATISTICS*\n\n` +
    `👥 Total Users: ${userCount}\n` +
    `✅ Active (7 days): ${activeUsers}\n` +
    `📅 Last Updated: ${new Date().toLocaleString()}\n\n` +
    `💡 Use /admin to access broadcasting features`,
    { parse_mode: "Markdown" }
  );
});

// Web App Data Handler for Admin Panel
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "❌ Unauthorized access.");
    return;
  }

  try {
    const data = JSON.parse(msg.web_app.data);
    
    if (data.type === 'broadcast') {
      // Preview the broadcast
      await bot.sendMessage(
        chatId,
        `📢 *BROADCAST PREVIEW*\n\n` +
        `Ready to send your message to all users?\n\n` +
        `Target: All bot users\n` +
        `Message type: ${data.hasImage ? 'Image + Text' : 'Text only'}\n` +
        `Buttons: ${data.buttons ? data.buttons.length : 0}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Send Broadcast", callback_data: `confirm_broadcast:${Buffer.from(JSON.stringify(data)).toString('base64')}` }
              ],
              [
                { text: "❌ Cancel", callback_data: "admin_panel" }
              ]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    await bot.sendMessage(chatId, "❌ Error processing broadcast data.");
  }
});

// Broadcast execution function
const executeBroadcast = async (adminChatId, broadcastData) => {
  const users = loadUsers();
  const userIds = Object.keys(users);
  
  let successCount = 0;
  let failCount = 0;
  
  await bot.sendMessage(adminChatId, `📤 Starting broadcast to ${userIds.length} users...`);

  for (const userId of userIds) {
    try {
      const chatId = parseInt(userId);
      
      // Prepare inline keyboard if buttons exist
      let replyMarkup = undefined;
      if (broadcastData.buttons && broadcastData.buttons.length > 0) {
        replyMarkup = {
          inline_keyboard: broadcastData.buttons.map(btn => {
            const button = { text: btn.text };
            if (btn.url) {
              button.url = btn.url;
            } else if (btn.webApp) {
              button.web_app = { url: btn.webApp };
            } else if (btn.callback) {
              button.callback_data = btn.callback;
            }
            return [button];
          })
        };
      }

      // Send based on content type
      if (broadcastData.image && broadcastData.text) {
        // Image with caption
        await bot.sendPhoto(chatId, broadcastData.image, {
          caption: broadcastData.text,
          parse_mode: "Markdown",
          reply_markup: replyMarkup
        });
      } else if (broadcastData.image) {
        // Image only
        await bot.sendPhoto(chatId, broadcastData.image, {
          reply_markup: replyMarkup
        });
      } else if (broadcastData.text) {
        // Text only
        await bot.sendMessage(chatId, broadcastData.text, {
          parse_mode: "Markdown",
          reply_markup: replyMarkup
        });
      }

      successCount++;
      
      // Add delay to avoid rate limiting (30 msgs/sec limit)
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`Failed to send to user ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send completion report
  await bot.sendMessage(
    adminChatId,
    `✅ *BROADCAST COMPLETED*\n\n` +
    `📤 Sent: ${successCount}\n` +
    `❌ Failed: ${failCount}\n` +
    `📊 Total: ${userIds.length}`,
    { parse_mode: "Markdown" }
  );
};

// --- Enhanced Command Handlers ---

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "Player";
  const userId = msg.from.id;

  // Track user
  addUser(userId, {
    chatId: chatId,
    firstName: userName,
    username: msg.from.username || null
  });

  await bot.sendMessage(
    chatId,
    "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `👋 እንኳን ደህና መጡ ${userName}! ለመጀመር ይሄን ይጫኑ 🚀`, callback_data: "start" }]
        ]
      }
    }
  );
});

bot.onText(/\/play/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  addUser(userId, { chatId: chatId });
  
  try {
    await bot.sendMessage(
      chatId,
      `🎯 *ለመጫወት ተዘጋጁ??*\n\n` +
      `🎮 በተኑን ይጫኑ እና ወደ ጌም ይወስዶታል!\n\n` +
      `💡 *Pro Tip:* Make sure you have a stable internet connection for the best gaming experience.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "🚀 ወደ ሃገሬ ጌምስ ሂድ", 
                web_app: { url: WEBAPP_URL } 
              }
            ],
            [
              { text: "📋 መመሪያ", callback_data: "quick_rules" },
              { text: "🔙 ተመለስ", callback_data: "main_menu" }
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

bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  addUser(userId, { chatId: chatId });
  
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
          { text: "🚀 ወደ ጨዋታ ይሂዱ", web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: "🌐 ወደ ዌብ ሳይት ይውጡ", url: WEBAPP_URL }
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
  const userName = callbackQuery.from.first_name || "Player";
  const userId = callbackQuery.from.id;

  await bot.answerCallbackQuery(callbackQuery.id);

  // Admin callbacks
  if (data === 'admin_broadcast') {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Unauthorized.");
      return;
    }

    await bot.sendMessage(
      chatId,
      `📢 *CREATE BROADCAST*\n\n` +
      `Use the web panel for the best experience creating broadcasts with images, text, and custom buttons.\n\n` +
      `🌐 Click below to open the admin panel:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Open Broadcast Creator", web_app: { url: ADMIN_PANEL_URL } }
            ],
            [
              { text: "🔙 Back", callback_data: "admin_panel" }
            ]
          ]
        }
      }
    );
    return;
  }

  if (data === 'admin_stats') {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Unauthorized.");
      return;
    }

    const users = loadUsers();
    const userCount = Object.keys(users).length;
    const activeUsers = Object.values(users).filter(u => {
      const lastInteraction = new Date(u.lastInteraction);
      const daysSince = (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    await bot.sendMessage(
      chatId,
      `📊 *BOT STATISTICS*\n\n` +
      `👥 Total Users: ${userCount}\n` +
      `✅ Active (7 days): ${activeUsers}\n` +
      `📅 Generated: ${new Date().toLocaleString()}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back", callback_data: "admin_panel" }]
          ]
        }
      }
    );
    return;
  }

  if (data === 'admin_panel') {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Unauthorized.");
      return;
    }

    await bot.editMessageText(
      `👨‍💼 *ADMIN PANEL*\n\n` +
      `Welcome back, Admin!\n\n` +
      `Choose an option:`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📢 Create Broadcast", callback_data: "admin_broadcast" }
            ],
            [
              { text: "📊 View Statistics", callback_data: "admin_stats" }
            ],
            [
              { text: "🌐 Open Web Panel", web_app: { url: ADMIN_PANEL_URL } }
            ]
          ]
        }
      }
    );
    return;
  }

  if (data.startsWith('confirm_broadcast:')) {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Unauthorized.");
      return;
    }

    try {
      const encodedData = data.replace('confirm_broadcast:', '');
      const broadcastData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
      
      await bot.editMessageText(
        `📤 Broadcast confirmed! Sending now...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      await executeBroadcast(chatId, broadcastData);
    } catch (error) {
      console.error('Error executing broadcast:', error);
      await bot.sendMessage(chatId, "❌ Error executing broadcast.");
    }
    return;
  }

  // Regular user callbacks
  addUser(userId, { chatId: chatId });

  switch (data) {
    case 'start':
      const logoSent = await sendLogo(bot, chatId, userName);
      
      if (!logoSent) {
        const logoMessage = `
    ╔══════════════════════════════════╗
    ║          🎯 ሃገሬ ቢንጎ          
    ╚══════════════════════════════════╝

    🌟 *እንኳን በደህና መጡ ${userName}!*

    🎮 *ለመጫወት ተዘጋጅተዋል?*
    💰 *በሃገር ውስጥ ካሉ ሌሎች ተጫዋቾች ጋር እየተፎካከሩ አሪፍ አሪፍ ሽልማቶችን ያሸንፉ!*`;

        await bot.sendMessage(chatId, logoMessage, {
          parse_mode: "Markdown"
        });
      }

      await bot.sendMessage(
        chatId,
        `🎮 ምን ማድረግ ይፈልጋሉ ${userName}?                                          .`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: "🚀 ወደ ጨዋታ ይሂዱ", 
                  web_app: { url: WEBAPP_URL } 
                }
              ],
              [
                { text: "📋 የጨዋታ መመሪያ", callback_data: "rules" },
              ],
              [
                { text: "🎁 ቦነሶች", callback_data: "bonuses" },
                { text: "💬 ድጋፍ", callback_data: "support" }
              ]
            ]
          }
        }
      );
      break;

    case 'main_menu':
      const mainMenuKeyboard = {
        inline_keyboard: [
          [
            { 
              text: "🚀 ወደ ጨዋታ ይሂዱ", 
              web_app: { url: WEBAPP_URL } 
            }
          ],
          [
            { text: "📋 የጨዋታ መመሪያ", callback_data: "rules" },
          ],
          [
            { text: "🎁 ቦነሶች", callback_data: "bonuses" },
            { text: "💬 ድጋፍ/Support", callback_data: "support" }
          ]
        ]
      };

      await bot.editMessageText(
        `🎮 *ምን ማረግ ይፈልጋሉ:*\n\n` +
        `• **ወደ ጌም**\n` +
        `• **መመሪያ**\n` +
        `• **ቦነስ**\n` +
        `• **ድጋፍ**`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: mainMenuKeyboard
        }
      );
      break;

    case 'rules':
      const rulesMessage = `📋 *HAGERE BINGO - የጨዋታ መመሪያ*\n\n` +
        `🎯 **የጨዋታው አላማ:**\n የቢንጎ ፓተርኑን ቀድሞ መዝጋት!\n\n` +
        `🎮 **ለመጫወት:**\n` +
        `1️⃣ መጫወት የሚፈልጉትን የጌም አይነት ይምረጡ\n` +
        `2️⃣ ካርቴላ ይግዙ\n` +
        `3️⃣ ጨዋታው እስኪጀመር ይጠብቁ\n` +
        `4️⃣ በየ 3-4 ሰከንድ የሚጠሩት ቁጥሮች እያዩ፣ ካርቴላ ላይ ምልክት ያርጉ\n` +
        `5️⃣ ሲስተሙ በራሱ(automatically) ውጤቶትን ቼክ በማድረግ አሸናፊውን ያሳውቃል!\n\n` +
        `6 የተጫወቱትን/የገዙትን የጌም ታሪክ (history) ላይ በመግባት ውጤቶን ማየት ይችላሉ!\n\n` +
        `🏆 **የተወሰኑ ማሸነፊያ ፓተርኖች:**\n` +
        `• ሙሉ ዝግ እና ግማሽ ዝግ\n` +
        `• 1 እና ከ 1 በላይ መስመሮች (አግድም, ቁመት, ሰያፍ)\n` +
        `• ከስተም ፓተርኖች\n\n` +
        `💰 **ሽልማቶች:**\n ባሉት ተጫዋቾች ላይ የተመሰረተ እና ሲስተሙ በሚያዘጋጀው ትልቅ ደራሽ`;

      bot.sendMessage(chatId, rulesMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🚀 አሁን ይጫውቱ", web_app: { url: WEBAPP_URL } }
            ],
            [
              { text: "🔙 ይመለሱ", callback_data: "main_menu" }
            ]
          ]
        }
      });
      break;

    case 'support':
      const supportMessage = `💬 *HAGERE BINGO SUPPORT*\n\n` +
        `ልንረደዎት ዝግጁ ነን ${userName}:\n\n` +
        `📧 **ቴሌግራም:** https://t.me/HagereGamesOnline \n` +
        `⏰ **Response Time:** Within 24 hours\n` +
        `**ጥያቄዎች:**\n` +
        `• ክፍያን በተመለከተ\n` +
        `• ጌም ላይ ሚገኙ ችግሮች ወይም ማስተካከያዎች\n` +
        `• ከ አካውንት ጋር በተያያዘ\n` +
        `• ማንኛውም ሃሳብ እና አስተያየት`;

      bot.sendMessage(chatId, supportMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💬 Join Support Group", url: "https://t.me/HagereGamesOnline" }
            ],
            [
              { text: "🔙 ተመለስ", callback_data: "main_menu" }
            ]
          ]
        }
      });
      break;

    case 'bonuses':
      await bot.sendMessage(
        chatId,
        `🎁 *AVAILABLE BONUSES*\n\n` +
        `🆕 **እንኳን ደህና መጡ ቦነስ:** የ10 ብር ጌም ክሬዲት\n` +
        `🎯 **1 መስመር ከ10 ጥሪ በታች:** 100 ብር\n` +
        `🎯 **2 መስመር ከ18 ጥሪ በታች:** 100 ብር\n` +
        `🎯 **ግማሽ ዝግ ከ28 ጥሪ በታች:** 100 ብር\n` +
        `🎯 **ሙሉ ዝግ ከ52 ጥሪ በታች:** 100 ብር\n`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔙 ተመለስ", callback_data: "main_menu" }
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

// --- Error Handlers ---
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
    console.log("   • Broadcasting system");
    console.log("   • User tracking");
    console.log("   • Admin panel");
    console.log(`   • ${ADMIN_IDS.length} admin(s) configured`);
  } catch (error) {
    console.error("❌ Failed to initialize bot:", error);
  }
};

initializeBot();
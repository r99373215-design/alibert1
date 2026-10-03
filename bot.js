const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_USERNAME = process.env.OWNER_USERNAME || '@xqwex0';
const PRODUCT_PATH = path.join(__dirname, 'products.json');

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing. Add it to .env or export it before starting the bot.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function readProducts() {
  try {
    const raw = fs.readFileSync(PRODUCT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}

function buildCatalogKeyboard() {
  const products = readProducts();

  const buttons = products.map((product) => [
    Markup.button.callback(product.name, `product:${product.id}`)
  ]);

  buttons.push([
    Markup.button.callback('Написать владельцу', 'owner')
  ]);

  return Markup.inlineKeyboard(buttons);
}

function sendCatalog(ctx) {
  const products = readProducts();

  if (!products.length) {
    return ctx.reply('Сейчас каталог пустой.');
  }

  const intro = 'Вот наш каталог товаров:\n\n';
  const content = products
    .map((product) => `${product.id}. ${product.name} — ${formatPrice(product.price)}\n${product.category}`)
    .join('\n\n');

  return ctx.reply(intro + content, buildCatalogKeyboard());
}

bot.start(async (ctx) => {
  const name = ctx.from?.first_name || 'друг';

  await ctx.reply(
    `Привет, ${name}! 👋\n\nДобро пожаловать в Albert Shop.\nВы можете посмотреть каталог, заказать товар или написать владельцу.`,
    Markup.keyboard([
      ['🛍 Каталог'],
      ['📦 Заказ'],
      ['💬 Написать владельцу'],
      ['❓ Помощь']
    ])
      .resize()
      .oneTime()
      .extra()
  );
});

bot.hears('🛍 Каталог', sendCatalog);
bot.command('catalog', sendCatalog);

bot.hears('📦 Заказ', (ctx) => {
  ctx.reply('Чтобы сделать заказ, напишите в формате:\n/order 1\n\nГде 1 — ID товара из каталога.');
});

bot.command('order', (ctx) => {
  const [_, rawId] = ctx.message.text.split(' ');
  const id = Number(rawId);
  const products = readProducts();
  const product = products.find((item) => Number(item.id) === id);

  if (!product) {
    return ctx.reply('Такой товар не найден. Проверьте ID или откройте каталог.');
  }

  const orderText = `Здравствуйте! Я хочу заказать: ${product.name}\nЦена: ${formatPrice(product.price)}\nКатегория: ${product.category}\n\nПожалуйста, свяжитесь со мной для оплаты и доставки.`;

  return ctx.reply(orderText, {
    reply_markup: {
      inline_keyboard: [[{ text: `Написать владельцу: ${OWNER_USERNAME}`, url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }]]
    }
  });
});

bot.hears('💬 Написать владельцу', (ctx) => {
  return ctx.reply(`Напишите владельцу: ${OWNER_USERNAME}`, {
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть чат', url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }]]
    }
  });
});

bot.hears('❓ Помощь', (ctx) => {
  ctx.reply('Команды:\n/start — приветствие\n/catalog — каталог\n/order 1 — быстрый заказ\n/support — связь с владельцем');
});

bot.command('support', (ctx) => {
  ctx.reply(`Связь с владельцем: ${OWNER_USERNAME}`, {
    reply_markup: {
      inline_keyboard: [[{ text: 'Написать в Telegram', url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }]]
    }
  });
});

bot.command('help', (ctx) => {
  ctx.reply('Команды:\n/start — приветствие\n/catalog — каталог\n/order <id> — сделать заказ\n/support — связь с владельцем');
});

bot.action(/product:(\d+)/, async (ctx) => {
  const parsedId = Number(ctx.match[1]);
  const products = readProducts();
  const product = products.find((item) => Number(item.id) === parsedId);

  if (!product) {
    return ctx.answerCbQuery('Товар не найден');
  }

  const message = [
    `*${product.name}*`,
    ``,
    `Категория: ${product.category}`,
    `Цена: ${formatPrice(product.price)}`,
    `Размеры: ${(product.sizes || ['One Size']).join(', ')}`,
    ``,
    product.description,
    ``,
    `Чтобы заказать — отправьте /order ${product.id}`
  ].join('\n');

  await ctx.answerCbQuery();
  return ctx.replyWithMarkdown(message, {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Заказать', callback_data: `order:${product.id}` },
        { text: 'Написать владельцу', url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }
      ]]
    }
  });
});

bot.action(/order:(\d+)/, async (ctx) => {
  const productId = Number(ctx.match[1]);
  const products = readProducts();
  const product = products.find((item) => Number(item.id) === productId);

  if (!product) {
    return ctx.answerCbQuery('Товар не найден');
  }

  const orderText = `Здравствуйте! Хочу заказать ${product.name}. Цена: ${formatPrice(product.price)}. Подскажите доступность и способ оплаты.`;
  await ctx.answerCbQuery('Формируем заказ');
  return ctx.reply(orderText, {
    reply_markup: {
      inline_keyboard: [[{ text: 'Написать владельцу', url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }]]
    }
  });
});

bot.action('owner', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply(`Связь с владельцем: ${OWNER_USERNAME}`, {
    reply_markup: {
      inline_keyboard: [[{ text: 'Написать в Telegram', url: `https://t.me/${OWNER_USERNAME.replace('@', '')}` }]]
    }
  });
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.launch();
console.log('Albert Shop bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

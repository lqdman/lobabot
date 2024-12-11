require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");

// Используем токен из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

// Путь к файлу links.txt
const LINKS_FILE_PATH = "./links.txt";

// Создание экземпляра бота
const bot = new Telegraf(TOKEN);

// Функция для проверки, является ли пользователь админом
const isAdmin = (ctx) => {
  return ctx.from.id.toString() === ADMIN_ID;
};

// Обработчик команды /start
bot.command("start", (ctx) => {
  if (isAdmin(ctx)) {
    ctx.reply("Привет! Я бот, который может отвечать на команду /start.");
  } else {
    ctx.reply("Извините, но эта команда доступна только админу.");
  }
});

// Обработчик команды /addlink
bot.command("addlink", (ctx) => {
  if (!isAdmin(ctx)) {
    ctx.reply("Извините, но эта команда доступна только админу.");
    return;
  }

  const text = ctx.message.text;
  const match = text.match(/\/addlink (.+)=(.+)/);

  if (!match) {
    ctx.reply("Неверный формат команды. Используйте /addlink месяц=ссылка");
    return;
  }

  const month = match[1].toLowerCase();
  const link = match[2];

  if (!month || !link) {
    ctx.reply("Неверный формат команды. Используйте /addlink месяц=ссылка");
    return;
  }

  const fullMonths = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];

  let fullMonth = null;
  for (const full of fullMonths) {
    if (full.startsWith(month)) {
      fullMonth = full;
      break;
    }
  }

  if (!fullMonth) {
    ctx.reply("Не удалось распознать месяц.");
    return;
  }

  fullMonth = fullMonth.charAt(0).toUpperCase() + fullMonth.slice(1);

  fs.readFile(LINKS_FILE_PATH, "utf8", (err, data) => {
    if (err) {
      console.error(`Ошибка чтения файла: ${err.message}`);
      ctx.reply("Произошла ошибка при чтении файла.");
      return;
    }

    const lines = data.split("\n");
    const updatedLines = lines
      .map((line) => {
        const [existingMonth, existingLink] = line.split("=");
        if (
          existingMonth &&
          existingMonth.toLowerCase() === fullMonth.toLowerCase()
        ) {
          return `${fullMonth}=${link}`;
        }
        return line;
      })
      .filter((line) => line.trim() !== "");

    const uniqueLinks = new Set();
    const finalLines = updatedLines.filter((line) => {
      const [, existingLink] = line.split("=");
      if (uniqueLinks.has(existingLink)) {
        return false;
      }
      uniqueLinks.add(existingLink);
      return true;
    });

    if (
      !finalLines.some((line) =>
        line.toLowerCase().startsWith(`${fullMonth.toLowerCase()}=`)
      )
    ) {
      finalLines.push(`${fullMonth}=${link}`);
    }

    fs.writeFile(LINKS_FILE_PATH, finalLines.join("\n"), (err) => {
      if (err) {
        console.error(`Ошибка записи в файл: ${err.message}`);
        ctx.reply("Произошла ошибка при записи в файл.");
      } else {
        console.log(`Обновлена запись: ${fullMonth}=${link}`);
        ctx.reply("Запись успешно обновлена или добавлена.");
      }
    });
  });
});

// Обработчик команды /looklinks
bot.command("looklinks", (ctx) => {
  if (!isAdmin(ctx)) {
    ctx.reply("Извините, но эта команда доступна только админу.");
    return;
  }

  if (!fs.existsSync(LINKS_FILE_PATH)) {
    ctx.reply("Файл links.txt не найден.");
    return;
  }

  fs.readFile(LINKS_FILE_PATH, "utf8", (err, data) => {
    if (err) {
      console.error(`Ошибка чтения файла: ${err.message}`);
      ctx.reply("Произошла ошибка при чтении файла.");
      return;
    }

    ctx.reply(`Содержимое файла links.txt:\n${data}`);
  });
});

bot.on("message", (ctx) => {
  if (ctx.message.text) {
    const text = ctx.message.text;

    console.log(`Получено сообщение: ${text}`);

    const dateRegex =
      /(\d{1,2})(?:[\s.,-]+)(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь|янв|фев|мар|апр|июн|июл|авг|сен|окт|ноя|дек)/i;
    const match = text.match(dateRegex);

    if (match) {
      const startDate = match[1];
      const endDate = match[2];
      const month = match[3];

      console.log(`Найдены даты: ${startDate}, ${endDate}, ${month}`);

      const monthWithCorrectEnding = getMonthWithCorrectEnding(month);

      // Формируем основное сообщение
      let response = `\`\`\`\nЗдравствуйте 👋😃 вы забронировали квартиру в Казани с ${startDate} по ${endDate} ${monthWithCorrectEnding}\n\nМеня зовут Руслан) буду курировать вопросы вашего проживания.\nУ нас бесконтактное заселение, за день до него пришлю вам всю информацию.\n\nЕсли есть вопросы пишите, если срочно звоните по номеру +7(904)661-09-49\n\n`;

      // Читаем файл links.txt для добавления инструкции
      fs.readFile(LINKS_FILE_PATH, "utf8", (err, data) => {
        if (err) {
          console.error(`Ошибка чтения файла: ${err.message}`);
          return;
        }

        const lines = data.split("\n");
        const monthPrefix = month.toLowerCase().slice(0, 3);
        const linkLine = lines.find((line) => {
          const [existingMonth] = line.split("=");
          return existingMonth.toLowerCase().startsWith(monthPrefix);
        });

        if (linkLine) {
          const [, link] = linkLine.split("=");
          response += `Доброе утро 😀 высылаю вам инструкцию к заселению\n——— ••• ———\n${link}\n\`\`\``;
        } else {
          response += `Доброе утро 😀 высылаю вам инструкцию к заселению\n——— ••• ———\n\`\`\``;
        }

        // Отправляем объединенное сообщение
        ctx.reply(response, { parse_mode: "Markdown" });
      });
    } else if (text.startsWith("https://lknpd.nalog.ru")) {
      const response = `Получил, спасибо за своевременность.\nПрикреплю [здесь ваш чек](${text})\n———                                                 • • •`;
      ctx.reply(response, { parse_mode: "Markdown" });
    } else {
      console.log("Даты не найдены");
    }
  }
});

// Функция для преобразования названия месяца в форму с правильным окончанием
function getMonthWithCorrectEnding(month) {
  const monthMap = {
    январь: "января",
    февраль: "февраля",
    март: "марта",
    апрель: "апреля",
    май: "мая",
    июнь: "июня",
    июль: "июля",
    август: "августа",
    сентябрь: "сентября",
    октябрь: "октября",
    ноябрь: "ноября",
    декабрь: "декабря",
    янв: "января",
    фев: "февраля",
    мар: "марта",
    апр: "апреля",
    июн: "июня",
    июл: "июля",
    авг: "августа",
    сен: "сентября",
    окт: "октября",
    ноя: "ноября",
    дек: "декабря",
  };

  return monthMap[month] || month;
}

// Запуск бота
bot.launch();

// Логирование ошибок
bot.catch((err) => {
  console.error(`Ошибка: ${err.message}`);
});

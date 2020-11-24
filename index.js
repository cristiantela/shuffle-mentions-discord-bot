require("dotenv").config();

const Discord = require("discord.js");

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Bot Shuffle is online!");
});

client.on("message", (message) => {
  if (message.author.id === client.user.id) {
    return false;
  }

  if (!message.content.startsWith("shuffle ")) {
    return false;
  }

  const users = [];
  const randomUsers = [];

  message.mentions.users.forEach((user) => {
    users.push(user.username);
  });

  const totalUsers = users.length;

  for (let i = 0; i < totalUsers; i++) {
    const index = Math.floor(Math.random() * users.length);

    const [removedUser] = users.splice(index, 1);

    randomUsers.push(removedUser);
  }

  const messageLines = [];

  randomUsers.forEach((user, index) => {
    messageLines.push(`${index + 1}. ${user}`);
  });

  message.channel.send(messageLines.join("\n"));

  console.log(
    `Guild: ${message.channel.guild.name} Channel: ${message.channel.name} Shuffled Mentions: ${randomUsers.length}`
  );
});

client.login(process.env.DISCORD_TOKEN);

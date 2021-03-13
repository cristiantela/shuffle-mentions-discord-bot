require("dotenv").config();

const Discord = require("discord.js");

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Bot Shuffle is online!");
});

const readPoll = (raw) => {
  const content = raw.split("\n");

  const header = content[1].match(/^\/\/ poll ([a-z0-9]+)( \((closed)\))?/);

  const poll = {
    id: header[1],
    closed: !!header[3],
    title: "",
    options: {},
  };

  poll.title = content[2];

  content.slice(3).forEach((option, index) => {
    const name = option.match(/^(..) (\d+% \((\d+)\) )?(.+)$/);

    const emoji = name[1];
    let total = name[3] ? Number(name[3]) : 0;
    const title = name[4];

    poll.options[emoji] = {
      text: title,
      total: total,
    };
  });

  return poll;
};

const calculatePercentage = (poll, votes) => {
  const totalVotes = Object.keys(poll.options).reduce(
    (previous, emoji) => previous + poll.options[emoji].total,
    0
  );

  return Math.floor((votes / totalVotes) * 1e2);
};

const renderPollMessage = (poll) => {
  const message = ["```js", `// poll ${poll.id}`];

  if (poll.closed) {
    message[1] = message[1] + " (closed)";
  }

  message.push(poll.title);

  Object.keys(poll.options).forEach((emoji) => {
    poll.options[emoji];

    const percentage = calculatePercentage(poll, poll.options[emoji].total);

    if (percentage) {
      message.push(
        `${emoji} ${percentage}% (${poll.options[emoji].total}) ${poll.options[emoji].text}`
      );
    } else {
      message.push(`${emoji} ${poll.options[emoji].text}`);
    }
  });

  return message.join("\n");
};

client.on("messageReactionAdd", (messageReaction, user) => {
  if (user.id === client.user.id) {
    console.log("it was the bot");
    return false;
  }

  if (messageReaction.message.author.id !== client.user.id) {
    console.log("it was not a message from the bot");
    return false;
  }

  const poll = readPoll(messageReaction.message.content);

  if (poll.closed) {
    console.log("poll closed");
    return false;
  }

  if (poll.options[messageReaction._emoji.name]) {
    poll.options[messageReaction._emoji.name].total++;
  }

  messageReaction.message.edit(renderPollMessage(poll));
});

client.on("messageReactionRemove", (messageReaction, user) => {
  console.log(messageReaction, user);
  if (user.id === client.user.id) {
    console.log("it was the bot");
    return false;
  }

  if (messageReaction.message.author.id !== client.user.id) {
    console.log("it was not a message from the bot");
    return false;
  }

  const content = messageReaction.message.content.split("\n");

  const poll = readPoll(messageReaction.message.content);

  if (poll.closed) {
    console.log("poll closed");
    return false;
  }

  if (poll.options[messageReaction._emoji.name]) {
    poll.options[messageReaction._emoji.name].total--;
  }

  messageReaction.message.edit(renderPollMessage(poll));
});

client.on("message", (message) => {
  if (message.author.id === client.user.id) {
    return false;
  }

  if (message.content.startsWith("create poll")) {
    const emojis = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛️", "⬜️", "🟫"];

    const args = message.content.split("\n");

    const id = (
      Math.floor(Math.random() * (Math.pow(36, 4) - 1 - Math.pow(36, 3))) +
      Math.pow(36, 3)
    ).toString(36);

    const response = ["```js", `// poll ${id}`, `\`\`\`**${args[1]}**`];

    const options = args.slice(2);

    options.forEach((option, index) => {
      response.push(`${emojis[index]} ${option}`);
    });

    message.channel.send(response.join("\n")).then(function (message) {
      options.forEach((option, index) => {
        message.react(emojis[index]);
      });
    });
  }

  if (/^(close|open) poll /.test(message.content)) {
    message.channel.messages.fetch({ limit: 50 }).then((messages) => {
      const [, status, id] = message.content.match(
        /^(close|open) poll ([a-z0-9]+)/
      );

      const pattern = `\`\`\`js\n// poll ${id}`;

      messages.forEach((message) => {
        if (message.content.startsWith(pattern)) {
          const poll = readPoll(message.content);

          poll.closed = status === "close";

          message.edit(renderPollMessage(poll));
        }
      });
    });
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

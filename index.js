var Discord = require('discord.js');
var axios = require('axios');
require('dotenv').config();

var client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
    ]
});

var TOKEN = process.env.DISCORD_TOKEN;
var CLIENT_ID = process.env.DISCORD_CLIENT_ID;
var PREFIX = '!ffstats';

var { REST, Routes, SlashCommandBuilder } = require('discord.js');
var rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log("🔄 Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {
                body: [
                    new SlashCommandBuilder()
                        .setName('freefire')
                        .setDescription('Get Free Fire player stats')
                        .addStringOption(option =>
                            option.setName('uid')
                                .setDescription('The Free Fire UID of the player')
                                .setRequired(true)
                        )
                ]
            }
        );
        console.log("✅ Slash commands registered successfully!");
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
}

client.once('ready', async () => {
    console.log("✅ Bot is online as " + client.user.tag);
    await registerCommands();
});

async function fetchFreeFireStats(uid) {
    var apiUrl = `https://id-game-checker.p.rapidapi.com/ff-player-info/${uid}/SG`;

    try {
        var response = await axios.get(apiUrl, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'id-game-checker.p.rapidapi.com'
            }
        });
        console.log('API Response:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    } catch (error) {
        console.error("❌ API Error:", error);
        return null;
    }
}

function createEmbeds(player, clan, banner, socialInfo, petInfo, diamondCost, creditScore, profileInfo, creditScoreInfo, captainBasicInfo) {
    const outfitImage = profileInfo?.clothes?.images?.[0] || 'https://example.com/default-banner.png';
    const avatarImage = player.avatars?.[0] || 'https://github.com/yousufcodemaster/Image/blob/main/doodlyyousuf.jpg?raw=true';

    // Convert Unix timestamp to readable date
    const createdAt = player.createAt ? new Date(player.createAt * 1000).toLocaleString() : 'N/A';
    const lastLoginAt = player.lastLoginAt ? new Date(player.lastLoginAt * 1000).toLocaleString() : 'N/A';

    // Convert period timestamps if available
    const periodStart = creditScoreInfo?.periodicSummaryStartTime ? new Date(Number(creditScoreInfo.periodicSummaryStartTime) * 1000).toLocaleString() : 'N/A';
    const periodEnd = creditScoreInfo?.periodicSummaryEndTime ? new Date(Number(creditScoreInfo.periodicSummaryEndTime) * 1000).toLocaleString() : 'N/A';

    // Get guild leader info
    const guildLeader = captainBasicInfo?.nickname || clan.leaderName || 'Unknown';
    const isLeader = (clan.captainId === player.accountId) ? 'Yes' : 'No';

    // Format weapon skins
    const weaponSkins = player.weaponSkinShows?.join(', ') || 'None';

    // Format skills
    const equippedSkills = profileInfo?.equippedSkills?.map(skill => `ID: ${skill.skillId}${skill.slotId ? ', Slot: ' + skill.slotId : ''}`).join('\n') || 'None';

    // Create the main embed with player info and avatar
    const mainEmbed = new Discord.EmbedBuilder()
        .setColor('#ff003c')
        .setImage(avatarImage) // Avatar as full-sized image
        .setTitle(`🔥 ${player.nickname || 'Unknown Player'} | Level: ${player.level || 'N/A'}`)
        .setDescription(`**${socialInfo.signature || "No signature available"}**\n\n**Account ID:** ${(player.accountId || 'N/A').toString()}`)
        .addFields(
            {
                name: "Player Information", value:
                    `⭐ Rank = ${player.rank || 'N/A'}\n\n` +
                    `🏆 Ranking Points = ${player.rankingPoints || 'N/A'}\n\n` +
                    `👍 Likes = ${player.liked || 'N/A'}\n\n` +
                    `📊 Badge Count = ${player.badgeCnt || 'N/A'}\n\n` +
                    `🔰 Badge ID = ${player.badgeId || 'N/A'}\n\n` +
                    `🏮 Season ID = ${player.seasonId || 'N/A'}\n\n` +
                    `👤 Account Type = ${player.accountType || 'N/A'}\n\n` +
                    `📍 Region = ${player.region || 'N/A'}\n\n` +
                    `⭐ Max Rank = ${player.maxRank || 'N/A'}\n\n` +
                    `📊 Experience = ${player.exp || 'N/A'}\n\n` +
                    `🎯 Pin ID = ${player.pinId || 'N/A'}\n\n` +
                    `🏆 Title = ${player.title || 'N/A'}\n\n` +
                    `🗣️ Language = ${socialInfo.language?.replace('Language_', '') || 'N/A'}\n\n` +
                    `🎮 Rank Show = ${socialInfo.rankShow?.replace('RankShow_', '') || 'N/A'}\n\n` +
                    `💎 Diamond Cost = ${diamondCost || 'N/A'}\n\n` +
                    `🎖️ Honour Score = ${creditScore || 'N/A'}\n\n` +
                    `🏅 Reward State = ${creditScoreInfo?.rewardState?.replace('RewardState_', '') || 'N/A'}\n\n` +
                    `📆 Period of Record = ${periodStart} to ${periodEnd}\n\n` +
                    `🔫 CS Rank = ${player.csRank || 'N/A'}\n\n` +
                    `🏆 CS Ranking Points = ${player.csRankingPoints || 'N/A'}\n\n` +
                    `⭐ CS Max Rank = ${player.csMaxRank || 'N/A'}\n\n` +
                    `🎮 Game Version = ${player.releaseVersion || 'N/A'}\n\n` +
                    `🔫 Weapon Skins = ${weaponSkins}\n\n` +
                    `🛡 Guild Name = ${clan.clanName || 'No Clan'}\n\n` +
                    `🆔 Guild ID = ${clan.clanId || 'N/A'}\n\n` +
                    `📜 Guild Description = ${clan.description || 'No description'}\n\n` +
                    `👑 Guild Leader = ${guildLeader}\n\n` +
                    `🆔 Guild Leader ID = ${clan.captainId || 'N/A'}\n\n` +
                    `🏅 Is Guild Leader = ${isLeader}\n\n` +
                    `🔼 Guild Level = ${clan.clanLevel || 'N/A'}\n\n` +
                    `👥 Guild Members = ${clan.memberNum || 'N/A'}/${clan.capacity || 'N/A'}\n\n` +
                    `🐕 Pet ID = ${petInfo.id || 'N/A'}\n\n` +
                    `📊 Pet Level = ${petInfo.level || 'N/A'}\n\n` +
                    `📈 Pet Experience = ${petInfo.exp || 'N/A'}\n\n` +
                    `👕 Pet Skin ID = ${petInfo.skinId || 'N/A'}\n\n` +
                    `⚔️ Pet Selected Skill = ${petInfo.selectedSkillId || 'N/A'}\n\n` +
                    `🎖️ Pet Selected = ${petInfo.isSelected ? 'Yes' : 'No'}\n\n` +
                    `📅 Created At = ${createdAt}\n\n` +
                    `⏱️ Last Login = ${lastLoginAt}`
            },
            {
                name: "Equipped Skills", value: equippedSkills
            },
            {
                name: "Profile Info", value:
                    `🎭 Avatar ID = ${profileInfo.avatarId || 'N/A'}\n\n` +
                    `👕 Clothes IDs = ${profileInfo.clothes?.ids?.join(', ') || 'None'}\n\n` +
                    `✅ Is Selected = ${profileInfo.isSelected ? 'Yes' : 'No'}\n\n` +
                    `✨ Is Selected Awaken = ${profileInfo.isSelectedAwaken ? 'Yes' : 'No'}`
            }
        )
        .setTimestamp()
        .setFooter({ text: 'Free Fire Stats Bot | Created by DoodlyYousuf', iconURL: 'https://cdn.discordapp.com/avatars/823836878339833876/b64cba8658d70dfc7247b684716d736d.webp?size=80' });

    // Create a second embed just for the outfit image
    const outfitEmbed = new Discord.EmbedBuilder()
        .setColor('#ff003c')
        .setImage(outfitImage)
        .setTitle(`👕 ${player.nickname || 'Unknown Player'}'s Outfit`);

    return [mainEmbed, outfitEmbed];
}

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    var args = message.content.slice(PREFIX.length).trim().split(/ +/);
    if (args.length < 1) return message.channel.send('❌ Please provide a Free Fire UID!');

    var uid = args[0];
    var data = await fetchFreeFireStats(uid);
    if (!data || !data.basicInfo) return message.channel.send('❌ Player not found!');

    var embeds = createEmbeds(
        data.basicInfo,
        data.clanBasicInfo || {},
        data.profileInfo?.clothes?.images?.[0],
        data.socialInfo || {},
        data.petInfo || {},
        data.diamondCostRes?.diamondCost,
        data.creditScoreInfo?.creditScore,
        data.profileInfo || {},
        data.creditScoreInfo || {},
        data.captainBasicInfo || {}
    );
    message.channel.send({ embeds: embeds });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'freefire') {
        var uid = interaction.options.getString('uid');
        await interaction.deferReply();

        var data = await fetchFreeFireStats(uid);
        if (!data || !data.basicInfo) return interaction.editReply('❌ Player not found!');

        var embeds = createEmbeds(
            data.basicInfo,
            data.clanBasicInfo || {},
            data.profileInfo?.clothes?.images?.[0],
            data.socialInfo || {},
            data.petInfo || {},
            data.diamondCostRes?.diamondCost,
            data.creditScoreInfo?.creditScore,
            data.profileInfo || {},
            data.creditScoreInfo || {},
            data.captainBasicInfo || {}
        );
        interaction.editReply({ embeds: embeds });
    }
});


client.login(TOKEN);
import { Command, CommandParameters, CommandType, CommandArgDefinition } from 'zumito-framework';
import { EmbedBuilder, GuildMember, User, MessageFlags } from 'zumito-framework/discord';
import { CanvasUtils } from '@zumito-team/canvas-module';
import { getStickmanfightEmbedColor } from '../config/StickmanfightConfig';

export class Stickmanfight extends Command {
    type = CommandType.any;
    args: CommandArgDefinition[] = [
        { name: 'user1', type: 'user', optional: true },
        { name: 'user2', type: 'user', optional: true },
    ];

    async execute({ message, interaction, args, trans }: CommandParameters): Promise<void> {
        const guild = message?.guild || interaction?.guild;
        if (!guild) return;
        const members = guild.members.cache.filter((m) => !m.user.bot).map((m) => m as GuildMember);
        if (members.length < 2) {
            if (interaction) {
                await interaction.reply({ content: 'Not enough members', flags: MessageFlags.Ephemeral });
            } else if (message) {
                await message.reply({ content: 'Not enough members' });
            }
            return;
        }
        const first = args.get('user1') as User | undefined;
        const second = args.get('user2') as User | undefined;

        const getRandomMember = (excludeId?: string): GuildMember => {
            const filtered = excludeId ? members.filter((m) => m.id !== excludeId) : members;
            return filtered[Math.floor(Math.random() * filtered.length)];
        };

        const firstMember = first ? (guild.members.cache.get(first.id) as GuildMember) : getRandomMember();
        const secondMember = second ? (guild.members.cache.get(second.id) as GuildMember) : getRandomMember(firstMember.id);

        const winner = Math.random() < 0.5 ? 'first' : 'second';

        const width = 500;
        const height = 300;
        const canvasUtil = new CanvasUtils({ width, height, delay: 100, quality: 10, repeat: 0, isGif: true });
        const ctx = canvasUtil.getContext();
        canvasUtil.startEncoder();

        const avatar1 = await CanvasUtils.loadImage(firstMember.user.displayAvatarURL({ extension: 'png', size: 64 }));
        const avatar2 = await CanvasUtils.loadImage(secondMember.user.displayAvatarURL({ extension: 'png', size: 64 }));

        const drawBackground = () => {
            canvasUtil.drawBackground('#87CEEB', '#90EE90');
            canvasUtil.drawRect(0, height - 40, width, 40, '#8B4513');

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            for (let i = 0; i < width; i += 30) {
                ctx.beginPath();
                ctx.moveTo(i, height - 40);
                ctx.lineTo(i + 15, height);
                ctx.stroke();
            }
        };

        const drawParticles = (x: number, y: number, color: string = '#FFD700') => {
            canvasUtil.drawParticles(x, y, color);
        };

        const drawStickman = (x: number, y: number, avatar: any, pose: string = 'normal', flip: boolean = false) => {
            ctx.save();
            let posX = x;
            if (flip) {
                ctx.scale(-1, 1);
                posX = -x;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(posX, height - 30, 20, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.save();
            ctx.beginPath();
            ctx.arc(posX, y, 20, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, posX - 20, y - 20, 40, 40);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(posX, y, 20, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            const drawLegs = (offset1: number, offset2: number) => {
                ctx.beginPath();
                ctx.moveTo(posX, y + 70);
                ctx.lineTo(posX + offset1, y + 120);
                ctx.moveTo(posX, y + 70);
                ctx.lineTo(posX + offset2, y + 120);
                ctx.stroke();
            };

            switch (pose) {
                case 'attack':
                    ctx.beginPath();
                    ctx.moveTo(posX, y + 20);
                    ctx.lineTo(posX + 5, y + 70);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX + 5, y + 35);
                    ctx.lineTo(posX + 35, y + 25);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX + 5, y + 35);
                    ctx.lineTo(posX - 15, y + 45);
                    ctx.stroke();

                    drawLegs(-10, 20);
                    break;
                case 'defend':
                    ctx.beginPath();
                    ctx.moveTo(posX, y + 20);
                    ctx.lineTo(posX, y + 70);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX, y + 35);
                    ctx.lineTo(posX - 25, y + 30);
                    ctx.moveTo(posX, y + 35);
                    ctx.lineTo(posX - 20, y + 50);
                    ctx.stroke();

                    drawLegs(-15, 15);
                    break;
                case 'hit':
                    ctx.beginPath();
                    ctx.moveTo(posX, y + 20);
                    ctx.lineTo(posX - 10, y + 70);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX - 10, y + 35);
                    ctx.lineTo(posX - 30, y + 20);
                    ctx.moveTo(posX - 10, y + 35);
                    ctx.lineTo(posX - 35, y + 45);
                    ctx.stroke();

                    drawLegs(-25, 5);
                    break;
                case 'ko':
                    ctx.beginPath();
                    ctx.moveTo(posX - 25, y + 20);
                    ctx.lineTo(posX + 25, y + 20);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX - 15, y + 20);
                    ctx.lineTo(posX - 35, y + 10);
                    ctx.moveTo(posX + 15, y + 20);
                    ctx.lineTo(posX + 35, y + 30);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX - 10, y + 20);
                    ctx.lineTo(posX - 20, y + 40);
                    ctx.moveTo(posX + 10, y + 20);
                    ctx.lineTo(posX + 20, y + 40);
                    ctx.stroke();
                    break;
                default:
                    ctx.beginPath();
                    ctx.moveTo(posX, y + 20);
                    ctx.lineTo(posX, y + 70);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(posX, y + 35);
                    ctx.lineTo(posX - 20, y + 50);
                    ctx.moveTo(posX, y + 35);
                    ctx.lineTo(posX + 20, y + 50);
                    ctx.stroke();

                    drawLegs(-15, 15);
            }

            ctx.restore();
        };

        for (let i = 0; i < 3; i++) {
            drawBackground();
            drawStickman(100, 150, avatar1);
            drawStickman(400, 150, avatar2, 'normal', true);

            if (i % 2 === 0) {
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.strokeText('FIGHT!', width / 2, 50);
                ctx.fillText('FIGHT!', width / 2, 50);
            }

            canvasUtil.addFrame();
        }

        for (let i = 0; i < 4; i++) {
            drawBackground();
            const approach = i * 20;
            drawStickman(120 + approach, 150, avatar1);
            drawStickman(380 - approach, 150, avatar2, 'normal', true);
            canvasUtil.addFrame();
        }

        for (let i = 0; i < 2; i++) {
            drawBackground();
            drawStickman(200, 150, avatar1);
            drawStickman(300, 150, avatar2, 'normal', true);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, width, height);

            canvasUtil.addFrame();
        }

        const combatSequence = [
            { p1: 'normal', p2: 'normal', effect: false },
            { p1: 'attack', p2: 'normal', effect: false },
            { p1: 'attack', p2: 'defend', effect: true },
            { p1: 'normal', p2: 'defend', effect: false },
            { p1: 'defend', p2: 'attack', effect: false },
            { p1: 'hit', p2: 'attack', effect: true },
            { p1: 'hit', p2: 'normal', effect: false },
            { p1: 'attack', p2: 'hit', effect: true },
        ];

        for (const seq of combatSequence) {
            drawBackground();

            if (winner === 'first') {
                drawStickman(200, 150, avatar1, seq.p1);
                drawStickman(300, 150, avatar2, seq.p2, true);
                if (seq.effect) {
                    drawParticles(290, 150, '#FF6B6B');
                }
            } else {
                drawStickman(200, 150, avatar1, seq.p2);
                drawStickman(300, 150, avatar2, seq.p1, true);
                if (seq.effect) {
                    drawParticles(210, 150, '#FF6B6B');
                }
            }

            canvasUtil.addFrame();
        }

        for (let i = 0; i < 3; i++) {
            drawBackground();

            if (winner === 'first') {
                drawStickman(200, 150, avatar1, 'normal');
                drawStickman(300, 150, avatar2, 'hit', true);
            } else {
                drawStickman(200, 150, avatar1, 'hit');
                drawStickman(300, 150, avatar2, 'normal', true);
            }

            if (i === 1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(0, 0, width, height);
            }

            canvasUtil.addFrame();
        }

        for (let i = 0; i < 5; i++) {
            drawBackground();

            if (winner === 'first') {
                drawStickman(200, 150, avatar1, 'normal');
                drawStickman(300, 190, avatar2, 'ko', true);
                if (i < 3) drawParticles(300, 190, '#FFD700');
            } else {
                drawStickman(200, 190, avatar1, 'ko');
                drawStickman(300, 150, avatar2, 'normal', true);
                if (i < 3) drawParticles(200, 190, '#FFD700');
            }

            if (i >= 1) {
                ctx.fillStyle = '#FF0000';
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.strokeText('K.O.!', width / 2, 220);
                ctx.fillText('K.O.!', width / 2, 220);

                if (i >= 2) {
                    drawParticles(width / 2, 220, '#FFD700');
                }
            }

            canvasUtil.addFrame();
        }

        const attachment = await canvasUtil.toAttachment('stickmanfight.gif');

        const embed = new EmbedBuilder()
            .setDescription(trans('result', {
                user1: firstMember.user.globalName || firstMember.user.username,
                user2: secondMember.user.globalName || secondMember.user.username,
                winner: winner === 'first'
                    ? (firstMember.user.globalName || firstMember.user.username)
                    : (secondMember.user.globalName || secondMember.user.username),
            }))
            .setColor(getStickmanfightEmbedColor())
            .setImage('attachment://stickmanfight.gif');

        (message || interaction!)?.reply({ embeds: [embed], files: [attachment] });
    }
}

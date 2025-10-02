import { createCanvas, Canvas, CanvasRenderingContext2D, Image } from 'canvas';
import GIFEncoder from 'gifencoder';
import { AttachmentBuilder } from 'zumito-framework/discord';
import sharp from 'sharp';

export interface CanvasConfig {
    width: number;
    height: number;
    isGif?: boolean;
    delay?: number;
    quality?: number;
    repeat?: number;
    format?: 'image/png' | 'image/jpeg';
}

export class CanvasUtils {
    private canvas: Canvas;
    private ctx: CanvasRenderingContext2D;
    private encoder: GIFEncoder | null = null;
    private config: CanvasConfig;

    constructor(config: CanvasConfig) {
        this.config = {
            isGif: false,
            delay: 100,
            quality: 10,
            repeat: 0,
            format: 'image/png',
            ...config
        };
        this.canvas = createCanvas(this.config.width, this.config.height);
        this.ctx = this.canvas.getContext('2d');

        if (this.config.isGif) {
            this.encoder = new GIFEncoder(this.config.width, this.config.height);
            this.encoder.setRepeat(this.config.repeat);
            this.encoder.setDelay(this.config.delay);
            this.encoder.setQuality(this.config.quality);
        }
    }

    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    getCanvas(): Canvas {
        return this.canvas;
    }

    startEncoder(): void {
        if (this.encoder) {
            this.encoder.start();
        }
    }

    addFrame(): void {
        if (this.encoder) {
            this.encoder.addFrame(this.ctx);
        } else {
            console.warn('addFrame called on a non-GIF canvas. This operation is ignored.');
        }
    }

    async toAttachment(filename?: string): Promise<AttachmentBuilder> {
        let buffer: Buffer;
        let finalFilename = filename;

        if (this.encoder) {
            this.encoder.finish();
            buffer = this.encoder.out.getData();
            if (!finalFilename) finalFilename = 'image.gif';
        } else {
            const format = this.config.format ?? 'image/png';
            if (format === 'image/jpeg') {
                buffer = this.canvas.toBuffer('image/jpeg', { quality: 0.95 });
            } else {
                buffer = this.canvas.toBuffer('image/png');
            }
            if (!finalFilename) {
                const ext = format.split('/')[1];
                finalFilename = `image.${ext}`;
            }
        }

        return new AttachmentBuilder(buffer, { name: finalFilename });
    }

    drawBackground(color1: string, color2: string): void {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    drawRect(x: number, y: number, width: number, height: number, color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    drawText(text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left'): void {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    drawParticles(x: number, y: number, color: string = '#FFD700'): void {
        this.ctx.fillStyle = color;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const px = x + Math.cos(angle) * (10 + Math.random() * 15);
            const py = y + Math.sin(angle) * (10 + Math.random() * 15);
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    static async loadImage(src: string): Promise<Image> {
        try {
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const imgBuffer = await sharp(Buffer.from(arrayBuffer)).toFormat('png').toBuffer();
            const { loadImage } = await import('canvas');
            return loadImage(imgBuffer);
        } catch (error) {
            console.error('Error loading image with Sharp:', error);
            throw error;
        }
    }
}

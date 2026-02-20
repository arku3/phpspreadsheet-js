import fs from 'node:fs';
import path from 'node:path';
import { Hyperlink } from '../../core/hyperlink.ts';
import { BaseDrawing } from './base-drawing.ts';

/**
 * Minimal port of PhpSpreadsheet's Worksheet\Drawing.
 *
 * Stores either a path (file/URL handled later in IO) and/or in-memory image data.
 */
export class Drawing extends BaseDrawing {
    public static readonly IMAGE_TYPES_CONVERSION_MAP: Record<string, string> = {
        gif: 'png',
        jpeg: 'jpeg',
        jpg: 'jpeg',
        png: 'png',
        bmp: 'png',
    };

    #path: string = '';
    #imageData: Uint8Array | null = null;
    #mimeType: string = '';
    #extension: string = '';
    #isUrl: boolean = false;

    /**
     * Get image path.
     */
    public getPath(): string {
        return this.#path;
    }

    /**
     * Set image path.
     *
     * No validation is performed here; IO layers can validate/extract image bytes later.
     */
    public setPath(
        filePath: string,
        mimeType: string = '',
        extension: string = '',
        verifyFile: boolean = true,
        allowExternal: boolean = true,
    ): this {
        this.#isUrl = false;
        if (/^data:image\/[a-z]+;base64,/.test(filePath)) {
            this.#path = filePath;
            this.#mimeType = mimeType;
            this.#extension = extension !== '' ? extension : this.#inferExtensionFromPath(filePath);
            return this;
        }

        if (/^(https?|ftp|file|s3):/.test(filePath)) {
            if (!allowExternal) {
                return this;
            }
            this.#isUrl = true;
            this.#path = filePath;
            this.#mimeType = mimeType;
            this.#extension = extension !== '' ? extension : this.#inferExtensionFromPath(filePath);
            return this;
        }

        if (verifyFile && filePath !== '' && !fs.existsSync(filePath)) {
            throw new Error(`File ${filePath} not found!`);
        }

        this.#path = filePath;
        this.#mimeType = mimeType;
        this.#extension = extension !== '' ? extension : this.#inferExtensionFromPath(filePath);
        return this;
    }

    /**
     * Get filename (basename of path).
     */
    public getFilename(): string {
        if (this.#path === '') return '';
        return path.basename(this.#path);
    }

    public getIndexedFilename(): string {
        const hash = Bun.hash(this.#path).toString(16);
        return `${hash}.${this.getExtension()}`;
    }

    public getMediaFilename(): string {
        return `image${this.getImageIndex()}${this.getImageFileExtensionForSave()}`;
    }

    /**
     * Get image bytes (if set).
     */
    public getImageData(): Uint8Array | null {
        return this.#imageData;
    }

    /**
     * Set image bytes.
     */
    public setImageData(data: Uint8Array | null, mimeType: string = '', extension: string = ''): this {
        this.#imageData = data;
        this.#mimeType = mimeType;
        if (extension !== '') {
            this.#extension = extension;
        }
        return this;
    }

    /**
     * Get MIME type (if known).
     */
    public getMimeType(): string {
        return this.#mimeType;
    }

    /**
     * Set MIME type.
     */
    public setMimeType(mimeType: string): this {
        this.#mimeType = mimeType;
        return this;
    }

    /**
     * Get file extension (if known).
     */
    public getExtension(): string {
        return this.#extension;
    }

    public getIsURL(): boolean {
        return this.#isUrl;
    }

    public getImageFileExtensionForSave(): string {
        const ext = this.getExtension().toLowerCase();
        const mapped = Drawing.IMAGE_TYPES_CONVERSION_MAP[ext];
        if (!mapped) {
            throw new Error('Unsupported image type in comment background. Supported types: PNG, JPEG, BMP, GIF.');
        }
        return `.${mapped}`;
    }

    public getImageMimeType(): string {
        if (this.#mimeType) {
            return this.#mimeType;
        }
        const ext = this.getImageFileExtensionForSave().slice(1);
        if (ext === 'png') return 'image/png';
        if (ext === 'jpeg') return 'image/jpeg';
        if (ext === 'gif') return 'image/gif';
        if (ext === 'bmp') return 'image/bmp';
        return 'image/png';
    }

    public getImageTypeForSave(): string {
        return this.getImageMimeType();
    }

    public override getHashCode(): string {
        const content = `${this.#path}${super.getHashCode()}Drawing`;
        return Bun.hash(content).toString(16);
    }

    /**
     * Set file extension.
     */
    public setExtension(extension: string): this {
        this.#extension = extension;
        return this;
    }

    public override clone(): Drawing {
        const drawing = new Drawing();
        drawing
            .setName(this.getName())
            .setDescription(this.getDescription())
            .setCoordinates(this.getCoordinates())
            .setOffsetX(this.getOffsetX())
            .setOffsetY(this.getOffsetY())
            .setWidth(this.getWidth())
            .setHeight(this.getHeight());

        if (this.getCoordinates2()) {
            drawing
                .setCoordinates2(this.getCoordinates2())
                .setOffsetX2(this.getOffsetX2())
                .setOffsetY2(this.getOffsetY2());
        }

        const hyperlink = this.getHyperlink();
        if (hyperlink) {
            const newLink = new Hyperlink(hyperlink.getUrl(), hyperlink.getTooltip());
            newLink.setLocation(hyperlink.getLocation());
            newLink.setDisplay(hyperlink.getDisplay());
            drawing.setHyperlink(newLink);
        }

        if (this.#path) {
            drawing.setPath(this.#path, this.#mimeType, this.#extension);
        }
        if (this.#imageData) {
            drawing.setImageData(this.#imageData, this.#mimeType, this.#extension);
        }

        return drawing;
    }

    #inferExtensionFromPath(filePath: string): string {
        const ext = path.extname(filePath);
        if (ext === '') return '';
        return ext.startsWith('.') ? ext.slice(1) : ext;
    }
}

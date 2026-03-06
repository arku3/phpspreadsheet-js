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
    public static readonly IMAGE_TYPES_CONVERSION_MAP: Record<number, number> = {
        [BaseDrawing.IMAGETYPE_GIF]: BaseDrawing.IMAGETYPE_PNG,
        [BaseDrawing.IMAGETYPE_JPEG]: BaseDrawing.IMAGETYPE_JPEG,
        [BaseDrawing.IMAGETYPE_PNG]: BaseDrawing.IMAGETYPE_PNG,
        [BaseDrawing.IMAGETYPE_BMP]: BaseDrawing.IMAGETYPE_PNG,
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
     * Mirrors PhpSpreadsheet: validates path and sets size/type when possible.
     */
    public setPath(
        filePath: string,
        verifyFile: boolean = true,
        _zip: unknown | null = null,
        allowExternal: boolean = true,
    ): this {
        this.#isUrl = false;
        if (/^data:image\/[a-z]+;base64,/.test(filePath)) {
            this.#path = filePath;
            const base64 = filePath.replace(/^data:image\/[a-z]+;base64,/, '');
            this.setSizesAndTypeFromData(Buffer.from(base64, 'base64'));
            return this;
        }

        this.#path = '';
        if (Drawing.#isUrlLike(filePath)) {
            if (!/^(http|https|file|ftp|s3):/i.test(filePath)) {
                throw new Error('Invalid protocol for linked drawing');
            }
            if (!allowExternal) {
                return this;
            }
            this.#isUrl = true;
            this.#path = filePath;
        } else if (filePath !== '') {
            const fileExists = fs.existsSync(filePath);
            if (verifyFile && !fileExists) {
                throw new Error(`File ${filePath} not found!`);
            }
            if (fileExists) {
                this.setSizesAndType(filePath);
                const extension = this.#inferExtensionFromPath(filePath).toLowerCase();
                const isBinaryImage = extension === 'bin' || extension === 'emf';
                if (this.getType() !== BaseDrawing.IMAGETYPE_UNKNOWN || isBinaryImage) {
                    this.#path = filePath;
                }
            }
        }

        if (this.#path === '' && verifyFile) {
            throw new Error(`File ${filePath} not found!`);
        }

        if (this.getWorksheet() && this.#path !== '') {
            this.getWorksheet()?.getCell(this.getCoordinates());
        }
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
        return `${hash}.${this.getImageFileExtensionForSave(false)}`;
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
        if (this.#extension !== '') {
            return this.#extension;
        }
        return this.#inferExtensionFromPath(this.#path);
    }

    public getIsURL(): boolean {
        return this.#isUrl;
    }

    public getImageFileExtensionForSave(includeDot: boolean = true): string {
        const mapped = Drawing.IMAGE_TYPES_CONVERSION_MAP[this.getType()];
        if (!mapped) {
            throw new Error('Unsupported image type in comment background. Supported types: PNG, JPEG, BMP, GIF.');
        }
        const extension = Drawing.#imageTypeToExtension(mapped);
        return includeDot ? `.${extension}` : extension;
    }

    public getImageMimeType(): string {
        const mapped = Drawing.IMAGE_TYPES_CONVERSION_MAP[this.getType()];
        if (!mapped) {
            throw new Error('Unsupported image type in comment background. Supported types: PNG, JPEG, BMP, GIF.');
        }
        return Drawing.#imageTypeToMime(mapped);
    }

    public getImageTypeForSave(): number {
        const mapped = Drawing.IMAGE_TYPES_CONVERSION_MAP[this.getType()];
        if (!mapped) {
            throw new Error('Unsupported image type in comment background. Supported types: PNG, JPEG, BMP, GIF.');
        }
        return mapped;
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
            drawing.setPath(this.#path, false, null, true);
        }
        if (this.#imageData) {
            drawing.setImageData(this.#imageData, this.#mimeType, this.#extension);
        }
        if (this.#mimeType) {
            drawing.setMimeType(this.#mimeType);
        }
        if (this.#extension) {
            drawing.setExtension(this.#extension);
        }

        return drawing;
    }

    #inferExtensionFromPath(filePath: string): string {
        const ext = path.extname(filePath);
        if (ext === '') return '';
        return ext.startsWith('.') ? ext.slice(1) : ext;
    }

    static #imageTypeToExtension(imageType: number): string {
        if (imageType === BaseDrawing.IMAGETYPE_PNG) return 'png';
        if (imageType === BaseDrawing.IMAGETYPE_JPEG) return 'jpeg';
        if (imageType === BaseDrawing.IMAGETYPE_GIF) return 'gif';
        if (imageType === BaseDrawing.IMAGETYPE_BMP) return 'bmp';
        return 'png';
    }

    static #imageTypeToMime(imageType: number): string {
        if (imageType === BaseDrawing.IMAGETYPE_PNG) return 'image/png';
        if (imageType === BaseDrawing.IMAGETYPE_JPEG) return 'image/jpeg';
        if (imageType === BaseDrawing.IMAGETYPE_GIF) return 'image/gif';
        if (imageType === BaseDrawing.IMAGETYPE_BMP) return 'image/bmp';
        return 'image/png';
    }

    static #isUrlLike(pathValue: string): boolean {
        return /^(https?:|ftp:|file:|s3:)/i.test(pathValue) || /^[\w\s\x00-\x1f]+:/u.test(pathValue);
    }
}

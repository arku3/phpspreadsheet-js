import path from 'node:path';
import { Hyperlink } from '../../core/hyperlink.ts';
import { BaseDrawing } from './base-drawing.ts';

/**
 * Minimal port of PhpSpreadsheet's Worksheet\Drawing.
 *
 * Stores either a path (file/URL handled later in IO) and/or in-memory image data.
 */
export class Drawing extends BaseDrawing {
    #path: string = '';
    #imageData: Uint8Array | null = null;
    #mimeType: string = '';
    #extension: string = '';

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
    public setPath(filePath: string, mimeType: string = '', extension: string = ''): this {
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
            drawing.setHyperlink(new Hyperlink(hyperlink.getUrl(), hyperlink.getLocation(), hyperlink.getTooltip()));
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

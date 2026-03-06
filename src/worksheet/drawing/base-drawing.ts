import fs from 'node:fs';
import { Hyperlink } from '../../core/hyperlink.ts';
import type { Worksheet } from '../../core/worksheet.ts';
import { Shadow } from './shadow.ts';

/**
 * Minimal port of PhpSpreadsheet's Worksheet\BaseDrawing.
 *
 * This is a pure domain model (no IO). For attaching drawings to a worksheet,
 * prefer `Worksheet.addDrawing()`.
 */
export class BaseDrawing {
    public static readonly EDIT_AS_ABSOLUTE = 'absolute';
    public static readonly EDIT_AS_ONECELL = 'oneCell';
    public static readonly EDIT_AS_TWOCELL = 'twoCell';
    static #validEditAs = [BaseDrawing.EDIT_AS_ABSOLUTE, BaseDrawing.EDIT_AS_ONECELL, BaseDrawing.EDIT_AS_TWOCELL];

    public static readonly IMAGETYPE_UNKNOWN = 0;
    public static readonly IMAGETYPE_GIF = 1;
    public static readonly IMAGETYPE_JPEG = 2;
    public static readonly IMAGETYPE_PNG = 3;
    public static readonly IMAGETYPE_BMP = 6;

    static #imageCounter: number = 0;

    #imageIndex: number;
    #name: string = '';
    #description: string = '';
    #worksheet: Worksheet | null = null;

    #coordinates: string = 'A1';
    #offsetX: number = 0;
    #offsetY: number = 0;
    #coordinates2: string = '';
    #offsetX2: number = 0;
    #offsetY2: number = 0;

    #width: number = 0;
    #height: number = 0;
    #imageWidth: number = 0;
    #imageHeight: number = 0;
    #resizeProportional: boolean = true;
    #rotation: number = 0;
    #flipHorizontal: boolean = false;
    #flipVertical: boolean = false;
    #shadow: Shadow;
    #type: number = BaseDrawing.IMAGETYPE_UNKNOWN;
    #srcRect: unknown | null = null;
    #opacity: number | null = null;
    #inCell: boolean | null = false;
    #index: number = 0;
    #editAs: string = '';

    #hyperlink: Hyperlink | null = null;

    public constructor() {
        BaseDrawing.#imageCounter++;
        this.#imageIndex = BaseDrawing.#imageCounter;
        this.#shadow = new Shadow();
    }

    /**
     * Unique index for this drawing instance.
     */
    public getImageIndex(): number {
        return this.#imageIndex;
    }

    /**
     * Get drawing name.
     */
    public getName(): string {
        return this.#name;
    }

    /**
     * Set drawing name.
     */
    public setName(name: string): this {
        this.#name = name;
        return this;
    }

    /**
     * Get drawing description.
     */
    public getDescription(): string {
        return this.#description;
    }

    /**
     * Set drawing description.
     */
    public setDescription(description: string): this {
        this.#description = description;
        return this;
    }

    /**
     * Get the owning worksheet (if attached).
     */
    public getWorksheet(): Worksheet | null {
        return this.#worksheet;
    }

    /**
     * Attach/detach this drawing to/from a worksheet.
     *
     * Note: this does not update any worksheet collections.
     * Prefer `Worksheet.addDrawing()` and `Worksheet.removeDrawing()`.
     */
    public setWorksheet(worksheet: Worksheet | null): this {
        return this.setWorksheetWithOverride(worksheet, false);
    }

    public setWorksheetWithOverride(worksheet: Worksheet | null, overrideOld: boolean = false): this {
        if (worksheet !== null && this.#worksheet !== null && this.#worksheet !== worksheet && !overrideOld) {
            throw new Error('A Worksheet has already been assigned. Drawings can only exist on one Worksheet.');
        }
        if (overrideOld && this.#worksheet && this.#worksheet !== worksheet) {
            this.#worksheet.removeDrawing(this);
        }
        this.#worksheet = worksheet;
        if (worksheet) {
            const getPath = (this as { getPath?: () => string }).getPath;
            if (typeof getPath === 'function' && getPath.call(this)) {
                worksheet.getCell(this.#coordinates);
            }
        }
        return this;
    }

    /**
     * Detach this drawing from any worksheet.
     */
    public detach(): void {
        this.#worksheet = null;
    }

    /**
     * Get top-left anchor coordinate (A1).
     */
    public getCoordinates(): string {
        return this.#coordinates;
    }

    /**
     * Set top-left anchor coordinate (A1).
     */
    public setCoordinates(coordinates: string): this {
        this.#coordinates = coordinates;
        if (this.#worksheet) {
            const getPath = (this as { getPath?: () => string }).getPath;
            if (typeof getPath === 'function' && getPath.call(this)) {
                this.#worksheet.getCell(this.#coordinates);
            }
        }
        return this;
    }

    /**
     * Get X offset from the top-left cell (maps to `xdr:colOff` in IO).
     */
    public getOffsetX(): number {
        return this.#offsetX;
    }

    /**
     * Set X offset from the top-left cell (maps to `xdr:colOff` in IO).
     */
    public setOffsetX(offsetX: number): this {
        this.#offsetX = offsetX;
        return this;
    }

    /**
     * Get Y offset from the top-left cell (maps to `xdr:rowOff` in IO).
     */
    public getOffsetY(): number {
        return this.#offsetY;
    }

    /**
     * Set Y offset from the top-left cell (maps to `xdr:rowOff` in IO).
     */
    public setOffsetY(offsetY: number): this {
        this.#offsetY = offsetY;
        return this;
    }

    /**
     * Get optional bottom-right anchor coordinate for two-cell anchors.
     * Empty string means unset.
     */
    public getCoordinates2(): string {
        return this.#coordinates2;
    }

    /**
     * Set optional bottom-right anchor coordinate for two-cell anchors.
     * Empty string means unset.
     */
    public setCoordinates2(coordinates2: string): this {
        this.#coordinates2 = coordinates2;
        return this;
    }

    /**
     * Get X offset for the second anchor (maps to `xdr:colOff`).
     */
    public getOffsetX2(): number {
        return this.#offsetX2;
    }

    /**
     * Set X offset for the second anchor (maps to `xdr:colOff`).
     */
    public setOffsetX2(offsetX2: number): this {
        this.#offsetX2 = offsetX2;
        return this;
    }

    /**
     * Get Y offset for the second anchor (maps to `xdr:rowOff`).
     */
    public getOffsetY2(): number {
        return this.#offsetY2;
    }

    /**
     * Set Y offset for the second anchor (maps to `xdr:rowOff`).
     */
    public setOffsetY2(offsetY2: number): this {
        this.#offsetY2 = offsetY2;
        return this;
    }

    /**
     * Get drawing width in pixels.
     */
    public getWidth(): number {
        return this.#width;
    }

    /**
     * Set drawing width in pixels.
     */
    public setWidth(width: number): this {
        if (this.#resizeProportional && width !== 0 && this.#width !== 0 && this.#height !== 0) {
            const ratio = this.#height / this.#width;
            this.#height = Math.round(ratio * width);
        }
        this.#width = width;
        return this;
    }

    /**
     * Get drawing height in pixels.
     */
    public getHeight(): number {
        return this.#height;
    }

    /**
     * Set drawing height in pixels.
     */
    public setHeight(height: number): this {
        if (this.#resizeProportional && height !== 0 && this.#width !== 0 && this.#height !== 0) {
            const ratio = this.#width / this.#height;
            this.#width = Math.round(ratio * height);
        }
        this.#height = height;
        return this;
    }

    public setWidthAndHeight(width: number, height: number): this {
        if (this.#width === 0 || this.#height === 0 || width === 0 || height === 0 || !this.#resizeProportional) {
            this.#width = width;
            this.#height = height;
            return this;
        }
        const xratio = width / this.#width;
        const yratio = height / this.#height;
        if (xratio * this.#height < height) {
            this.#height = Math.ceil(xratio * this.#height);
            this.#width = width;
        } else {
            this.#width = Math.ceil(yratio * this.#width);
            this.#height = height;
        }
        return this;
    }

    public getResizeProportional(): boolean {
        return this.#resizeProportional;
    }

    public setResizeProportional(resizeProportional: boolean): this {
        this.#resizeProportional = resizeProportional;
        return this;
    }

    public getRotation(): number {
        return this.#rotation;
    }

    public setRotation(rotation: number): this {
        this.#rotation = rotation;
        return this;
    }

    public getShadow(): Shadow {
        return this.#shadow;
    }

    public setShadow(shadow: Shadow | null): this {
        this.#shadow = shadow ?? new Shadow();
        return this;
    }

    public getFlipHorizontal(): boolean {
        return this.#flipHorizontal;
    }

    public setFlipHorizontal(flipHorizontal: boolean): this {
        this.#flipHorizontal = flipHorizontal;
        return this;
    }

    public getFlipVertical(): boolean {
        return this.#flipVertical;
    }

    public setFlipVertical(flipVertical: boolean): this {
        this.#flipVertical = flipVertical;
        return this;
    }

    public getOpacity(): number | null {
        return this.#opacity;
    }

    public setOpacity(opacity: number | null): this {
        this.#opacity = opacity;
        return this;
    }

    public isInCell(): boolean | null {
        return this.#inCell;
    }

    public setInCell(inCell: boolean): this {
        this.#inCell = inCell;
        return this;
    }

    public getIndex(): number {
        return this.#index;
    }

    public setIndex(index: number): this {
        this.#index = index;
        return this;
    }

    public getSrcRect(): unknown | null {
        return this.#srcRect;
    }

    public setSrcRect(srcRect: unknown | null): this {
        this.#srcRect = srcRect;
        return this;
    }

    public getImageWidth(): number {
        return this.#imageWidth;
    }

    public getImageHeight(): number {
        return this.#imageHeight;
    }

    public getType(): number {
        return this.#type;
    }

    public getEditAs(): string {
        return this.#editAs;
    }

    public setEditAs(editAs: string): this {
        this.#editAs = editAs;
        return this;
    }

    public validEditAs(): boolean {
        return BaseDrawing.#validEditAs.includes(this.#editAs);
    }

    /**
     * Get optional drawing hyperlink.
     */
    public getHyperlink(): Hyperlink | null {
        return this.#hyperlink;
    }

    /**
     * Set optional drawing hyperlink.
     */
    public setHyperlink(hyperlink: Hyperlink | null): void {
        this.#hyperlink = hyperlink;
    }

    public clone(): BaseDrawing {
        const drawing = new BaseDrawing();
        drawing
            .setName(this.getName())
            .setDescription(this.getDescription())
            .setCoordinates(this.getCoordinates())
            .setOffsetX(this.getOffsetX())
            .setOffsetY(this.getOffsetY())
            .setWidth(this.getWidth())
            .setHeight(this.getHeight())
            .setResizeProportional(this.getResizeProportional())
            .setRotation(this.getRotation())
            .setFlipHorizontal(this.getFlipHorizontal())
            .setFlipVertical(this.getFlipVertical())
            .setOpacity(this.getOpacity())
            .setInCell(this.isInCell() ?? false)
            .setIndex(this.getIndex());

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

        drawing.setShadow(BaseDrawing.cloneShadow(this.#shadow));
        drawing.#imageWidth = this.#imageWidth;
        drawing.#imageHeight = this.#imageHeight;
        drawing.#type = this.#type;
        drawing.#srcRect = this.#srcRect;
        drawing.#editAs = this.#editAs;

        return drawing;
    }

    public getHashCode(): string {
        const content = [
            this.#name,
            this.#description,
            this.#worksheet ? this.#worksheet.getTitle() : '',
            this.#coordinates,
            this.#offsetX,
            this.#offsetY,
            this.#coordinates2,
            this.#offsetX2,
            this.#offsetY2,
            this.#width,
            this.#height,
            this.#rotation,
            this.#shadow.getHashCode(),
            'BaseDrawing',
        ].join('');
        return Bun.hash(content).toString(16);
    }

    protected setSizesAndType(filePath: string, data?: Uint8Array): void {
        const buffer = data ?? (filePath ? fs.readFileSync(filePath) : null);
        if (!buffer) {
            return;
        }
        const info = BaseDrawing.detectImageInfo(buffer);
        if (!info) {
            return;
        }
        this.#imageWidth = info.width;
        this.#imageHeight = info.height;
        this.#type = info.type;
        if (this.#width === 0) {
            this.#width = info.width;
        }
        if (this.#height === 0) {
            this.#height = info.height;
        }
    }

    protected setSizesAndTypeFromData(data: Uint8Array): void {
        this.setSizesAndType('', data);
    }

    protected setImageDimensions(width: number, height: number, type: number = BaseDrawing.IMAGETYPE_UNKNOWN): void {
        this.#imageWidth = width;
        this.#imageHeight = height;
        this.#type = type;
        if (this.#width === 0) {
            this.#width = width;
        }
        if (this.#height === 0) {
            this.#height = height;
        }
    }

    private static cloneShadow(shadow: Shadow): Shadow {
        const cloned = new Shadow();
        cloned
            .setVisible(shadow.getVisible())
            .setBlurRadius(shadow.getBlurRadius())
            .setDistance(shadow.getDistance())
            .setDirection(shadow.getDirection())
            .setAlignment(shadow.getAlignment())
            .setColor(shadow.getColor())
            .setAlpha(shadow.getAlpha());
        return cloned;
    }

    protected static detectImageInfo(data: Uint8Array): { type: number; width: number; height: number } | null {
        const buffer = Buffer.from(data);

        // PNG
        if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47 && buffer.readUInt32BE(4) === 0x0d0a1a0a) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            return { type: BaseDrawing.IMAGETYPE_PNG, width, height };
        }

        // GIF
        if (buffer.length >= 10) {
            const header = buffer.toString('ascii', 0, 6);
            if (header === 'GIF87a' || header === 'GIF89a') {
                const width = buffer.readUInt16LE(6);
                const height = buffer.readUInt16LE(8);
                return { type: BaseDrawing.IMAGETYPE_GIF, width, height };
            }
        }

        // JPEG
        if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
            let offset = 2;
            while (offset < buffer.length) {
                if (buffer[offset] !== 0xff) {
                    offset += 1;
                    continue;
                }
                const marker = buffer[offset + 1] ?? 0;
                const length = buffer.readUInt16BE(offset + 2);
                if (marker >= 0xc0 && marker <= 0xc3) {
                    const height = buffer.readUInt16BE(offset + 5);
                    const width = buffer.readUInt16BE(offset + 7);
                    return { type: BaseDrawing.IMAGETYPE_JPEG, width, height };
                }
                offset += 2 + length;
            }
        }

        // BMP
        if (buffer.length >= 26 && buffer.toString('ascii', 0, 2) === 'BM') {
            const headerSize = buffer.readUInt32LE(14);
            if (headerSize >= 40 && buffer.length >= 26) {
                const width = buffer.readInt32LE(18);
                const height = Math.abs(buffer.readInt32LE(22));
                return { type: BaseDrawing.IMAGETYPE_BMP, width, height };
            }
        }

        return null;
    }
}

import type { Worksheet } from '../../core/worksheet.ts';
import { Hyperlink } from '../../core/hyperlink.ts';
import { Coordinate } from '../../utils/coordinate.ts';

/**
 * Minimal port of PhpSpreadsheet's Worksheet\BaseDrawing.
 *
 * This is a pure domain model (no IO). For attaching drawings to a worksheet,
 * prefer `Worksheet.addDrawing()`.
 */
export class BaseDrawing {
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

    #hyperlink: Hyperlink | null = null;

    public constructor() {
        BaseDrawing.#imageCounter++;
        this.#imageIndex = BaseDrawing.#imageCounter;
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
        this.#worksheet = worksheet;
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
        this.#coordinates = BaseDrawing.#normalizeCoordinate(coordinates);
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
        this.#coordinates2 = coordinates2 === '' ? '' : BaseDrawing.#normalizeCoordinate(coordinates2);
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
        this.#height = height;
        return this;
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
    public setHyperlink(hyperlink: Hyperlink | null): this {
        this.#hyperlink = hyperlink;
        return this;
    }

    static #normalizeCoordinate(cellCoordinate: string): string {
        const coordinate = cellCoordinate.toUpperCase();
        if (Coordinate.coordinateIsRange(coordinate)) {
            throw new Error('Cell coordinate string can not be a range of cells.');
        }
        if (coordinate.includes('!')) {
            throw new Error('Cell coordinate must not include a worksheet reference.');
        }
        if (coordinate.includes('$')) {
            throw new Error('Cell coordinate string must not be absolute.');
        }
        if (coordinate.length === 0) {
            throw new Error('Cell coordinate can not be zero-length string.');
        }
        if (!/^[A-Z]+\d+$/.test(coordinate)) {
            throw new Error('Cell coordinate string is not a valid A1 reference.');
        }
        return coordinate;
    }
}

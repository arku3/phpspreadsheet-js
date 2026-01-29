import { Color } from '../../style/color.ts';
import { createHash } from 'node:crypto';

export class Shadow {
    // Shadow alignment
    public static readonly SHADOW_BOTTOM = 'b';
    public static readonly SHADOW_BOTTOM_LEFT = 'bl';
    public static readonly SHADOW_BOTTOM_RIGHT = 'br';
    public static readonly SHADOW_CENTER = 'ctr';
    public static readonly SHADOW_LEFT = 'l';
    public static readonly SHADOW_TOP = 't';
    public static readonly SHADOW_TOP_LEFT = 'tl';
    public static readonly SHADOW_TOP_RIGHT = 'tr';

    #visible: boolean = false;
    #blurRadius: number = 6;
    #distance: number = 2;
    #direction: number = 0;
    #alignment: string = Shadow.SHADOW_BOTTOM_RIGHT;
    #color: Color;
    #alpha: number = 50;

    constructor() {
        this.#color = new Color(Color.COLOR_BLACK);
    }

    public getVisible(): boolean {
        return this.#visible;
    }

    public setVisible(visible: boolean): this {
        this.#visible = visible;
        return this;
    }

    public getBlurRadius(): number {
        return this.#blurRadius;
    }

    public setBlurRadius(blurRadius: number): this {
        this.#blurRadius = blurRadius;
        return this;
    }

    public getDistance(): number {
        return this.#distance;
    }

    public setDistance(distance: number): this {
        this.#distance = distance;
        return this;
    }

    public getDirection(): number {
        return this.#direction;
    }

    public setDirection(direction: number): this {
        this.#direction = direction;
        return this;
    }

    public getAlignment(): string {
        return this.#alignment;
    }

    public setAlignment(alignment: string): this {
        this.#alignment = alignment;
        return this;
    }

    public getColor(): Color {
        return this.#color;
    }

    public setColor(color: Color): this {
        this.#color = color;
        return this;
    }

    public getAlpha(): number {
        return this.#alpha;
    }

    public setAlpha(alpha: number): this {
        this.#alpha = alpha;
        return this;
    }

    public getHashCode(): string {
        return createHash('md5')
            .update(this.#visible ? 't' : 'f')
            .update(String(this.#blurRadius))
            .update(String(this.#distance))
            .update(String(this.#direction))
            .update(this.#alignment)
            .update(this.#color.getHashCode())
            .update(String(this.#alpha))
            .update('Shadow')
            .digest('hex');
    }
}

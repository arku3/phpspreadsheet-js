import { Color } from '../color.ts';
import { ConditionalFormatValueObject } from './conditional-format-value-object.ts';

/**
 * Conditional Color Scale.
 */
export class ConditionalColorScale {
    #minimumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #midpointConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #maximumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;

    #minimumColor: Color | null = null;
    #midpointColor: Color | null = null;
    #maximumColor: Color | null = null;

    #sqref: string | null = null;

    public getMinimumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#minimumConditionalFormatValueObject;
    }

    public setMinimumConditionalFormatValueObject(
        minimumConditionalFormatValueObject: ConditionalFormatValueObject,
    ): this {
        this.#minimumConditionalFormatValueObject = minimumConditionalFormatValueObject;
        return this;
    }

    public getMidpointConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#midpointConditionalFormatValueObject;
    }

    public setMidpointConditionalFormatValueObject(
        midpointConditionalFormatValueObject: ConditionalFormatValueObject,
    ): this {
        this.#midpointConditionalFormatValueObject = midpointConditionalFormatValueObject;
        return this;
    }

    public getMaximumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#maximumConditionalFormatValueObject;
    }

    public setMaximumConditionalFormatValueObject(
        maximumConditionalFormatValueObject: ConditionalFormatValueObject,
    ): this {
        this.#maximumConditionalFormatValueObject = maximumConditionalFormatValueObject;
        return this;
    }

    public getMinimumColor(): Color | null {
        return this.#minimumColor;
    }

    public setMinimumColor(minimumColor: Color): this {
        this.#minimumColor = minimumColor;
        return this;
    }

    public getMidpointColor(): Color | null {
        return this.#midpointColor;
    }

    public setMidpointColor(midpointColor: Color | null): this {
        this.#midpointColor = midpointColor;
        return this;
    }

    public getMaximumColor(): Color | null {
        return this.#maximumColor;
    }

    public setMaximumColor(maximumColor: Color): this {
        this.#maximumColor = maximumColor;
        return this;
    }

    public getSqRef(): string | null {
        return this.#sqref;
    }

    public setSqRef(sqref: string): this {
        this.#sqref = sqref;
        return this;
    }

    // TODO: implement getColorForValue and related logic if we want to support evaluation in JS
}

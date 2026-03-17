import { ConditionalFormatValueObject } from './conditional-format-value-object.ts';

export class ConditionalDataBarExtension {
    #minLength: number | null = null;
    #maxLength: number | null = null;
    #border: boolean | null = null;
    #gradient: boolean | null = null;
    #direction: string | null = null;
    #negativeBarBorderColorSameAsPositive: boolean | null = null;
    #axisPosition: string | null = null;
    #maximumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #minimumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #borderColor: string | null = null;
    #negativeFillColor: string | null = null;
    #negativeBorderColor: string | null = null;
    #axisColor: { rgb: string | null; theme: string | null; tint: string | null } = {
        rgb: null,
        theme: null,
        tint: null,
    };

    public getXmlAttributes(): Record<string, string | number> {
        const attributes: Record<string, string | number> = {};
        for (const [key, value] of Object.entries({
            minLength: this.#minLength,
            maxLength: this.#maxLength,
            direction: this.#direction,
            axisPosition: this.#axisPosition,
        })) {
            if (value !== null) {
                attributes[key] = value;
            }
        }
        for (const [key, value] of Object.entries({
            border: this.#border,
            gradient: this.#gradient,
            negativeBarBorderColorSameAsPositive: this.#negativeBarBorderColorSameAsPositive,
        })) {
            if (value !== null) {
                attributes[key] = value ? '1' : '0';
            }
        }

        return attributes;
    }

    public getXmlElements(): Record<string, Record<string, string>> {
        const elements: Record<string, Record<string, string>> = {};
        for (const [key, value] of Object.entries({
            borderColor: this.#borderColor,
            negativeFillColor: this.#negativeFillColor,
            negativeBorderColor: this.#negativeBorderColor,
        })) {
            if (value !== null) {
                elements[key] = { rgb: value };
            }
        }
        const axisColor = Object.fromEntries(
            Object.entries(this.#axisColor).filter(([, value]) => value !== null),
        ) as Record<string, string>;
        if (Object.keys(axisColor).length > 0) {
            elements.axisColor = axisColor;
        }

        return elements;
    }

    public getMinLength(): number | null {
        return this.#minLength;
    }
    public setMinLength(minLength: number): this {
        this.#minLength = minLength;
        return this;
    }
    public getMaxLength(): number | null {
        return this.#maxLength;
    }
    public setMaxLength(maxLength: number): this {
        this.#maxLength = maxLength;
        return this;
    }
    public getBorder(): boolean | null {
        return this.#border;
    }
    public setBorder(border: boolean): this {
        this.#border = border;
        return this;
    }
    public getGradient(): boolean | null {
        return this.#gradient;
    }
    public setGradient(gradient: boolean): this {
        this.#gradient = gradient;
        return this;
    }
    public getDirection(): string | null {
        return this.#direction;
    }
    public setDirection(direction: string): this {
        this.#direction = direction;
        return this;
    }
    public getNegativeBarBorderColorSameAsPositive(): boolean | null {
        return this.#negativeBarBorderColorSameAsPositive;
    }
    public setNegativeBarBorderColorSameAsPositive(value: boolean): this {
        this.#negativeBarBorderColorSameAsPositive = value;
        return this;
    }
    public getAxisPosition(): string | null {
        return this.#axisPosition;
    }
    public setAxisPosition(axisPosition: string): this {
        this.#axisPosition = axisPosition;
        return this;
    }
    public getMaximumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#maximumConditionalFormatValueObject;
    }
    public setMaximumConditionalFormatValueObject(value: ConditionalFormatValueObject): this {
        this.#maximumConditionalFormatValueObject = value;
        return this;
    }
    public getMinimumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#minimumConditionalFormatValueObject;
    }
    public setMinimumConditionalFormatValueObject(value: ConditionalFormatValueObject): this {
        this.#minimumConditionalFormatValueObject = value;
        return this;
    }
    public getBorderColor(): string | null {
        return this.#borderColor;
    }
    public setBorderColor(borderColor: string): this {
        this.#borderColor = borderColor;
        return this;
    }
    public getNegativeFillColor(): string | null {
        return this.#negativeFillColor;
    }
    public setNegativeFillColor(negativeFillColor: string): this {
        this.#negativeFillColor = negativeFillColor;
        return this;
    }
    public getNegativeBorderColor(): string | null {
        return this.#negativeBorderColor;
    }
    public setNegativeBorderColor(negativeBorderColor: string): this {
        this.#negativeBorderColor = negativeBorderColor;
        return this;
    }
    public getAxisColor(): { rgb: string | null; theme: string | null; tint: string | null } {
        return { ...this.#axisColor };
    }
    public setAxisColor(rgb: string | null, theme: string | null = null, tint: string | null = null): this {
        this.#axisColor = { rgb, theme, tint };
        return this;
    }

    public clone(): ConditionalDataBarExtension {
        const cloned = new ConditionalDataBarExtension();
        if (this.#minLength !== null) cloned.setMinLength(this.#minLength);
        if (this.#maxLength !== null) cloned.setMaxLength(this.#maxLength);
        if (this.#border !== null) cloned.setBorder(this.#border);
        if (this.#gradient !== null) cloned.setGradient(this.#gradient);
        if (this.#direction !== null) cloned.setDirection(this.#direction);
        if (this.#negativeBarBorderColorSameAsPositive !== null) {
            cloned.setNegativeBarBorderColorSameAsPositive(this.#negativeBarBorderColorSameAsPositive);
        }
        if (this.#axisPosition !== null) cloned.setAxisPosition(this.#axisPosition);
        if (this.#minimumConditionalFormatValueObject) {
            cloned.setMinimumConditionalFormatValueObject(this.#minimumConditionalFormatValueObject.clone());
        }
        if (this.#maximumConditionalFormatValueObject) {
            cloned.setMaximumConditionalFormatValueObject(this.#maximumConditionalFormatValueObject.clone());
        }
        if (this.#borderColor !== null) cloned.setBorderColor(this.#borderColor);
        if (this.#negativeFillColor !== null) cloned.setNegativeFillColor(this.#negativeFillColor);
        if (this.#negativeBorderColor !== null) cloned.setNegativeBorderColor(this.#negativeBorderColor);
        cloned.setAxisColor(this.#axisColor.rgb, this.#axisColor.theme, this.#axisColor.tint);
        return cloned;
    }
}

import type { Worksheet } from '../../core/worksheet.ts';
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
    #valueArray: number[] = [];
    #minValue: number = 0;
    #midValue: number = 0;
    #maxValue: number = 0;
    #worksheet: Worksheet | null = null;

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

    public setSqRef(sqref: string, worksheet: Worksheet | null = null): this {
        this.#sqref = sqref;
        if (worksheet) {
            this.#worksheet = worksheet;
        }
        return this;
    }

    public setScaleArray(): this {
        if (this.#sqref !== null && this.#worksheet !== null) {
            this.#valueArray = [];
            for (const range of this.#sqref.split(',')) {
                const values = this.#worksheet.rangeToArray(range, null, true, true, true);
                for (const row of Object.values(values)) {
                    for (const value of Object.values(row as Record<string, unknown>)) {
                        this.#valueArray.push(Number(value));
                    }
                }
            }
            this.prepareColorScale();
        }
        return this;
    }

    public prepareColorScale(): this {
        if (
            this.#minimumConditionalFormatValueObject &&
            this.#maximumConditionalFormatValueObject &&
            this.#minimumColor &&
            this.#maximumColor
        ) {
            if (
                this.#midpointConditionalFormatValueObject &&
                this.#midpointConditionalFormatValueObject.getType() !== 'None'
            ) {
                this.#minValue = this.#getLimitValue(
                    this.#minimumConditionalFormatValueObject.getType(),
                    Number(this.#minimumConditionalFormatValueObject.getValue() ?? 0),
                    Number(this.#minimumConditionalFormatValueObject.getCellFormula() ?? 0),
                );
                this.#midValue = this.#getLimitValue(
                    this.#midpointConditionalFormatValueObject.getType(),
                    Number(this.#midpointConditionalFormatValueObject.getValue() ?? 0),
                    Number(this.#midpointConditionalFormatValueObject.getCellFormula() ?? 0),
                );
                this.#maxValue = this.#getLimitValue(
                    this.#maximumConditionalFormatValueObject.getType(),
                    Number(this.#maximumConditionalFormatValueObject.getValue() ?? 0),
                    Number(this.#maximumConditionalFormatValueObject.getCellFormula() ?? 0),
                );
            } else {
                this.#minValue = this.#getLimitValue(
                    this.#minimumConditionalFormatValueObject.getType(),
                    Number(this.#minimumConditionalFormatValueObject.getValue() ?? 0),
                    Number(this.#minimumConditionalFormatValueObject.getCellFormula() ?? 0),
                );
                this.#maxValue = this.#getLimitValue(
                    this.#maximumConditionalFormatValueObject.getType(),
                    Number(this.#maximumConditionalFormatValueObject.getValue() ?? 0),
                    Number(this.#maximumConditionalFormatValueObject.getCellFormula() ?? 0),
                );
                this.#midValue = (this.#minValue + this.#maxValue) / 2;
                this.#midpointColor = new Color(
                    this.#interpolateColor(this.#minimumColor.getARGB(), this.#maximumColor.getARGB(), 0.5),
                );
            }
        }
        return this;
    }

    public colorScaleReadyForUse(): boolean {
        return this.#minimumColor !== null && this.#midpointColor !== null && this.#maximumColor !== null;
    }

    public getColorForValue(value: number): string {
        const minColor = this.#minimumColor?.getARGB();
        const midColor = this.#midpointColor?.getARGB();
        const maxColor = this.#maximumColor?.getARGB();
        if (!minColor || !midColor || !maxColor) {
            return 'FF000000';
        }
        if (value <= this.#minValue) return minColor;
        if (value >= this.#maxValue) return maxColor;
        if (value === this.#midValue) return midColor;
        if (value < this.#midValue) {
            const blend = (value - this.#minValue) / (this.#midValue - this.#minValue);
            return this.#interpolateColor(minColor, midColor, blend);
        }
        const blend = (value - this.#midValue) / (this.#maxValue - this.#midValue);
        return this.#interpolateColor(midColor, maxColor, blend);
    }

    public clone(): ConditionalColorScale {
        const cloned = new ConditionalColorScale();
        if (this.#minimumConditionalFormatValueObject) {
            cloned.setMinimumConditionalFormatValueObject(this.#minimumConditionalFormatValueObject.clone());
        }
        if (this.#midpointConditionalFormatValueObject) {
            cloned.setMidpointConditionalFormatValueObject(this.#midpointConditionalFormatValueObject.clone());
        }
        if (this.#maximumConditionalFormatValueObject) {
            cloned.setMaximumConditionalFormatValueObject(this.#maximumConditionalFormatValueObject.clone());
        }
        if (this.#minimumColor) cloned.setMinimumColor(this.#minimumColor.clone());
        if (this.#midpointColor) cloned.setMidpointColor(this.#midpointColor.clone());
        if (this.#maximumColor) cloned.setMaximumColor(this.#maximumColor.clone());
        if (this.#sqref) cloned.setSqRef(this.#sqref, this.#worksheet);
        cloned.#valueArray = [...this.#valueArray];
        cloned.#minValue = this.#minValue;
        cloned.#midValue = this.#midValue;
        cloned.#maxValue = this.#maxValue;
        return cloned;
    }

    #getLimitValue(type: string, value: number = 0, formula: number = 0): number {
        if (this.#valueArray.length === 0) {
            return 0;
        }
        if (type === 'min') return Math.min(...this.#valueArray);
        if (type === 'max') return Math.max(...this.#valueArray);
        if (type === 'formula') return formula;
        if (type === 'percent') {
            const min = Math.min(...this.#valueArray);
            const max = Math.max(...this.#valueArray);
            return min + (value / 100) * (max - min);
        }
        if (type === 'percentile') {
            const sorted = [...this.#valueArray].sort((a, b) => a - b);
            if (sorted.length === 0) return 0;
            const rank = (value / 100) * (sorted.length - 1);
            const low = Math.floor(rank);
            const high = Math.ceil(rank);
            if (low === high) return sorted[low] ?? 0;
            const blend = rank - low;
            return (sorted[low] ?? 0) * (1 - blend) + (sorted[high] ?? 0) * blend;
        }
        return 0;
    }

    #interpolateColor(startArgb: string, endArgb: string, blend: number): string {
        const blendClamped = Math.max(0, Math.min(1, blend));
        const parse = (argb: string): [number, number, number, number] => [
            parseInt(argb.slice(0, 2), 16),
            parseInt(argb.slice(2, 4), 16),
            parseInt(argb.slice(4, 6), 16),
            parseInt(argb.slice(6, 8), 16),
        ];
        const [a1, r1, g1, b1] = parse(startArgb);
        const [a2, r2, g2, b2] = parse(endArgb);
        const mix = (x: number, y: number) => Math.trunc(y * blendClamped + x * (1 - blendClamped));
        const result = [mix(a1, a2), mix(r1, r2), mix(g1, g2), mix(b1, b2)]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('');
        return result.toUpperCase();
    }
}

import { Conditional } from '../../conditional.ts';
import { Style } from '../../style.ts';

export interface WizardInterface {
    getCellRange(): string;
    setCellRange(cellRange: string): void;
    getStyle(): Style;
    setStyle(style: Style): void;
    getStopIfTrue(): boolean;
    setStopIfTrue(stopIfTrue: boolean): void;
    getConditional(): Conditional;
}

import { Drawing } from './drawing.ts';

export class HeaderFooterDrawing extends Drawing {
    public override getHashCode(): string {
        const content = [
            this.getPath(),
            this.getName(),
            this.getOffsetX(),
            this.getOffsetY(),
            this.getWidth(),
            this.getHeight(),
            'HeaderFooterDrawing',
        ].join('');
        return Bun.hash(content).toString(16);
    }
}

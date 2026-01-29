import { describe, expect, it } from 'bun:test';
import { RgbTint } from '../../src/style/rgb-tint.ts';

describe('RgbTint', () => {
    it('should tint white to darker', () => {
        // White: 255, 255, 255. Tint -0.1
        const result = RgbTint.rgbAndTintToRgb(255, 255, 255, -0.1);
        expect(result).toBe('E6E6E6'); // 255 * (1 + -0.1) = 229.5 -> E6
    });

    it('should tint black to lighter', () => {
        // Black: 0, 0, 0. Tint 0.1
        const result = RgbTint.rgbAndTintToRgb(0, 0, 0, 0.1);
        expect(result).toBe('1A1A1A'); // 255 * 0.1 = 25.5 -> 1A
    });

    it('should handle zero tint', () => {
        const result = RgbTint.rgbAndTintToRgb(100, 150, 200, 0);
        expect(result).toBe('6496C8');
    });

    it('should match Excel HLS algorithm for positive tint', () => {
        // Excel formula for positive tint: color * (1 - tint) + (255 * tint)
        // Let's try 0000FF (0, 0, 255) with 0.5 tint
        // R: 0 * 0.5 + 255 * 0.5 = 127.5 -> Math.round(127.5) = 128 -> 80
        // G: 0 * 0.5 + 255 * 0.5 = 127.5 -> Math.round(127.5) = 128 -> 80
        // B: 255 * 0.5 + 255 * 0.5 = 255 -> FF
        const result = RgbTint.rgbAndTintToRgb(0, 0, 255, 0.5);
        expect(result).toBe('8080FF');
    });
});

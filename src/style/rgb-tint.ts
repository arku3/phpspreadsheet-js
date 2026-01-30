/**
 * Class to handle tint applied to color.
 * Code borrows heavily from some Python projects.
 *
 * @see https://docs.python.org/3/library/colorsys.html
 * @see https://gist.github.com/Mike-Honey/b36e651e9a7f1d2e1d60ce1c63b9b633
 */
export class RgbTint {
    private static readonly ONE_THIRD = 1.0 / 3.0;
    private static readonly ONE_SIXTH = 1.0 / 6.0;
    private static readonly TWO_THIRD = 2.0 / 3.0;
    private static readonly RGBMAX = 255.0;

    /**
     * MS Excel's tint function expects that HLS is base 240.
     *
     * @see https://social.msdn.microsoft.com/Forums/en-US/e9d8c136-6d62-4098-9b1b-dac786149f43/excel-color-tint-algorithm-incorrect?forum=os_binaryfile#d3c2ac95-52e0-476b-86f1-e2a697f24969
     */
    private static readonly HLSMAX = 240.0;

    /**
     * Convert red/green/blue to hue/luminance/saturation.
     *
     * @param red 0.0 through 1.0
     * @param green 0.0 through 1.0
     * @param blue 0.0 through 1.0
     *
     * @return [hue, luminance, saturation]
     */
    private static rgbToHls(red: number, green: number, blue: number): [number, number, number] {
        const maxc = Math.max(red, green, blue);
        const minc = Math.min(red, green, blue);
        const luminance = (minc + maxc) / 2.0;
        if (minc === maxc) {
            return [0.0, luminance, 0.0];
        }
        const maxMinusMin = maxc - minc;
        let s: number;
        if (luminance <= 0.5) {
            s = maxMinusMin / (maxc + minc);
        } else {
            s = maxMinusMin / (2.0 - maxc - minc);
        }
        const rc = (maxc - red) / maxMinusMin;
        const gc = (maxc - green) / maxMinusMin;
        const bc = (maxc - blue) / maxMinusMin;
        let h: number;
        if (red === maxc) {
            h = bc - gc;
        } else if (green === maxc) {
            h = 2.0 + rc - bc;
        } else {
            h = 4.0 + gc - rc;
        }
        h = RgbTint.positiveDecimalPart(h / 6.0);

        return [h, luminance, s];
    }

    /**
     * Convert hue/luminance/saturation to red/green/blue.
     *
     * @param hue 0.0 through 1.0
     * @param luminance 0.0 through 1.0
     * @param saturation 0.0 through 1.0
     *
     * @return [red, green, blue]
     */
    private static hlsToRgb(hue: number, luminance: number, saturation: number): [number, number, number] {
        if (saturation === 0.0) {
            return [luminance, luminance, luminance];
        }
        let m2: number;
        if (luminance <= 0.5) {
            m2 = luminance * (1.0 + saturation);
        } else {
            m2 = luminance + saturation - luminance * saturation;
        }
        const m1 = 2.0 * luminance - m2;

        return [
            RgbTint.vFunction(m1, m2, hue + RgbTint.ONE_THIRD),
            RgbTint.vFunction(m1, m2, hue),
            RgbTint.vFunction(m1, m2, hue - RgbTint.ONE_THIRD),
        ];
    }

    private static vFunction(m1: number, m2: number, hue: number): number {
        hue = RgbTint.positiveDecimalPart(hue);
        if (hue < RgbTint.ONE_SIXTH) {
            return m1 + (m2 - m1) * hue * 6.0;
        }
        if (hue < 0.5) {
            return m2;
        }
        if (hue < RgbTint.TWO_THIRD) {
            return m1 + (m2 - m1) * (RgbTint.TWO_THIRD - hue) * 6.0;
        }

        return m1;
    }

    private static positiveDecimalPart(num: number): number {
        const res = num % 1.0;

        return res >= 0.0 ? res : 1.0 + res;
    }

    /**
     * Convert red/green/blue to HLSMAX-based hue/luminance/saturation.
     *
     * @return [hue, luminance, saturation]
     */
    private static rgbToMsHls(red: number, green: number, blue: number): [number, number, number] {
        const red01 = red / RgbTint.RGBMAX;
        const green01 = green / RgbTint.RGBMAX;
        const blue01 = blue / RgbTint.RGBMAX;
        const [hue, luminance, saturation] = RgbTint.rgbToHls(red01, green01, blue01);

        return [
            Math.round(hue * RgbTint.HLSMAX),
            Math.round(luminance * RgbTint.HLSMAX),
            Math.round(saturation * RgbTint.HLSMAX),
        ];
    }

    /**
     * Converts HLSMAX based HLS values to rgb values in the range (0,1).
     *
     * @return [red, green, blue]
     */
    private static msHlsToRgb(hue: number, lightness: number, saturation: number): [number, number, number] {
        return RgbTint.hlsToRgb(hue / RgbTint.HLSMAX, lightness / RgbTint.HLSMAX, saturation / RgbTint.HLSMAX);
    }

    /**
     * Tints HLSMAX based luminance.
     *
     * @see http://ciintelligence.blogspot.co.uk/2012/02/converting-excel-theme-color-and-tint.html
     */
    private static tintLuminance(tint: number, luminance: number): number {
        if (tint < 0) {
            return Math.round(luminance * (1.0 + tint));
        }

        return Math.round(luminance * (1.0 - tint) + (RgbTint.HLSMAX - RgbTint.HLSMAX * (1.0 - tint)));
    }

    /**
     * Return result of tinting supplied rgb as 6 hex digits.
     */
    public static rgbAndTintToRgb(red: number, green: number, blue: number, tint: number): string {
        const [hue, luminance, saturation] = RgbTint.rgbToMsHls(red, green, blue);
        const [r, g, b] = RgbTint.msHlsToRgb(hue, RgbTint.tintLuminance(tint, luminance), saturation);

        const toHex = (c: number) => {
            const hex = Math.round(c * RgbTint.RGBMAX)
                .toString(16)
                .toUpperCase();
            return hex.length === 1 ? '0' + hex : hex;
        };

        return toHex(r) + toHex(g) + toHex(b);
    }
}

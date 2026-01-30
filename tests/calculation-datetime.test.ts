import { describe, it, expect } from 'bun:test';
import { Calculation } from '../src/calculation/calculation.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';

describe('Calculation Engine - DateTime Functions', () => {
    function setup() {
        const spreadsheet = new Spreadsheet();
        const calculation = spreadsheet.getCalculationEngine();
        return { spreadsheet, calculation };
    }

    describe('TODAY', () => {
        it('should return current date as Excel serial', () => {
            const { spreadsheet, calculation } = setup();
            const result = calculation.calculateFormula('=TODAY()', spreadsheet.getActiveSheet(), 'A1');
            
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(44000);
        });
    });

    describe('NOW', () => {
        it('should return current date/time as Excel serial', () => {
            const { spreadsheet, calculation } = setup();
            const result = calculation.calculateFormula('=NOW()', spreadsheet.getActiveSheet(), 'A1');
            
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(44000);
            expect(result % 1).toBeGreaterThan(0);
        });
    });

    describe('DATE', () => {
        it('should create date from year, month, day', () => {
            const { spreadsheet, calculation } = setup();
            const result = calculation.calculateFormula('=DATE(2024,1,15)', spreadsheet.getActiveSheet(), 'A1');
            
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(45000);
        });
    });

    describe('YEAR', () => {
        it('should extract year from date', () => {
            const { spreadsheet, calculation } = setup();
            // Excel date serial number for 2024-01-15
            spreadsheet.getActiveSheet().getCell('A1').setValue(45306);
            
            const result = calculation.calculateFormula('=YEAR(A1)', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(2024);
        });
    });

    describe('MONTH', () => {
        it('should extract month from date', () => {
            const { spreadsheet, calculation } = setup();
            // Excel date serial number for 2024-01-15
            spreadsheet.getActiveSheet().getCell('A1').setValue(45306);
            
            const result = calculation.calculateFormula('=MONTH(A1)', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(1);
        });
    });

    describe('DAY', () => {
        it('should extract day from date', () => {
            const { spreadsheet, calculation } = setup();
            // Excel date serial number for 2024-01-15
            spreadsheet.getActiveSheet().getCell('A1').setValue(45306);
            
            const result = calculation.calculateFormula('=DAY(A1)', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(15);
        });
    });

    describe('WEEKDAY', () => {
        it('should return day of week with default returnType', () => {
            const { spreadsheet, calculation } = setup();
            // Excel date serial number for 2024-01-15
            spreadsheet.getActiveSheet().getCell('A1').setValue(45306);
            
            const result = calculation.calculateFormula('=WEEKDAY(A1)', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(2);
        });
    });

    describe('TIME', () => {
        it('should create time serial from hour, minute, second', () => {
            const { spreadsheet, calculation } = setup();
            const result = calculation.calculateFormula('=TIME(12,0,0)', spreadsheet.getActiveSheet(), 'A1');
            
            expect(result).toBe(0.5);
        });
    });

    describe('HOUR', () => {
        it('should extract hour from time', () => {
            const { spreadsheet, calculation } = setup();
            spreadsheet.getActiveSheet().getCell('A1').setValue(0.5);
            
            const result = calculation.calculateFormula('=HOUR(A1)', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(12);
        });
    });

    describe('DATEDIF', () => {
        it('should calculate days between dates', () => {
            const { spreadsheet, calculation } = setup();
            // Excel date serial numbers for 2024-01-15 and 2024-01-25
            spreadsheet.getActiveSheet().getCell('A1').setValue(45306);
            spreadsheet.getActiveSheet().getCell('A2').setValue(45316);
            
            const result = calculation.calculateFormula('=DATEDIF(A1,A2,"D")', spreadsheet.getActiveSheet(), 'B1');
            
            expect(result).toBe(10);
        });
    });
});

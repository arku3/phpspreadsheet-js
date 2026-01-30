import { describe, expect, it } from 'bun:test';
import { DataValidation } from '../src/core/data-validation.ts';

describe('DataValidation', () => {
    it('should create DataValidation with default values', () => {
        const validation = new DataValidation();

        expect(validation.getType()).toBe(DataValidation.TYPE_NONE);
        expect(validation.getOperator()).toBe(DataValidation.OPERATOR_BETWEEN);
        expect(validation.getErrorStyle()).toBe(DataValidation.STYLE_STOP);
        expect(validation.getAllowBlank()).toBe(false);
        expect(validation.getShowDropDown()).toBe(false);
        expect(validation.getShowInputMessage()).toBe(false);
        expect(validation.getShowErrorMessage()).toBe(false);
        expect(validation.getFormula1()).toBe('');
        expect(validation.getFormula2()).toBe('');
        expect(validation.getErrorTitle()).toBe('');
        expect(validation.getError()).toBe('');
        expect(validation.getPromptTitle()).toBe('');
        expect(validation.getPrompt()).toBe('');
        expect(validation.getSqref()).toBe(null);
    });

    it('should set and get validation type', () => {
        const validation = new DataValidation();

        validation.setType(DataValidation.TYPE_LIST);
        expect(validation.getType()).toBe(DataValidation.TYPE_LIST);

        validation.setType(DataValidation.TYPE_WHOLE);
        expect(validation.getType()).toBe(DataValidation.TYPE_WHOLE);
    });

    it('should set and get operator', () => {
        const validation = new DataValidation();

        validation.setOperator(DataValidation.OPERATOR_GREATERTHAN);
        expect(validation.getOperator()).toBe(DataValidation.OPERATOR_GREATERTHAN);

        validation.setOperator('');
        expect(validation.getOperator()).toBe(DataValidation.DEFAULT_OPERATOR);
    });

    it('should set and get error style', () => {
        const validation = new DataValidation();

        validation.setErrorStyle(DataValidation.STYLE_WARNING);
        expect(validation.getErrorStyle()).toBe(DataValidation.STYLE_WARNING);
    });

    it('should set and get boolean properties', () => {
        const validation = new DataValidation();

        validation.setAllowBlank(true);
        expect(validation.getAllowBlank()).toBe(true);

        validation.setShowDropDown(true);
        expect(validation.getShowDropDown()).toBe(true);

        validation.setShowInputMessage(true);
        expect(validation.getShowInputMessage()).toBe(true);

        validation.setShowErrorMessage(true);
        expect(validation.getShowErrorMessage()).toBe(true);
    });

    it('should set and get formulas', () => {
        const validation = new DataValidation();

        validation.setFormula1('A1:A10');
        expect(validation.getFormula1()).toBe('A1:A10');

        validation.setFormula2('100');
        expect(validation.getFormula2()).toBe('100');
    });

    it('should set and get error messages', () => {
        const validation = new DataValidation();

        validation.setErrorTitle('Invalid Input');
        expect(validation.getErrorTitle()).toBe('Invalid Input');

        validation.setError('Please enter a valid value');
        expect(validation.getError()).toBe('Please enter a valid value');
    });

    it('should set and get prompt messages', () => {
        const validation = new DataValidation();

        validation.setPromptTitle('Enter Value');
        expect(validation.getPromptTitle()).toBe('Enter Value');

        validation.setPrompt('Please enter a number between 1 and 100');
        expect(validation.getPrompt()).toBe('Please enter a number between 1 and 100');
    });

    it('should set and get cell reference (sqref)', () => {
        const validation = new DataValidation();

        validation.setSqref('A1:A10');
        expect(validation.getSqref()).toBe('A1:A10');

        validation.setSqref(null);
        expect(validation.getSqref()).toBe(null);
    });

    it('should generate hash code', () => {
        const validation = new DataValidation();

        validation.setType(DataValidation.TYPE_LIST);
        validation.setFormula1('Option1,Option2,Option3');

        const hashCode = validation.getHashCode();
        expect(hashCode.length).toBeGreaterThan(0);
        expect(hashCode).toContain('Option1,Option2,Option3');
    });

    it('should support method chaining', () => {
        const validation = new DataValidation();

        const result = validation
            .setType(DataValidation.TYPE_WHOLE)
            .setOperator(DataValidation.OPERATOR_BETWEEN)
            .setFormula1('1')
            .setFormula2('100')
            .setAllowBlank(false)
            .setShowInputMessage(true)
            .setPromptTitle('Number Input')
            .setPrompt('Enter a number between 1 and 100')
            .setShowErrorMessage(true)
            .setErrorTitle('Invalid Number')
            .setError('Please enter a number between 1 and 100');

        expect(result).toBe(validation);
        expect(validation.getType()).toBe(DataValidation.TYPE_WHOLE);
        expect(validation.getFormula1()).toBe('1');
        expect(validation.getFormula2()).toBe('100');
    });

    it('should define all validation type constants', () => {
        expect(DataValidation.TYPE_NONE).toBe('none');
        expect(DataValidation.TYPE_CUSTOM).toBe('custom');
        expect(DataValidation.TYPE_DATE).toBe('date');
        expect(DataValidation.TYPE_DECIMAL).toBe('decimal');
        expect(DataValidation.TYPE_LIST).toBe('list');
        expect(DataValidation.TYPE_TEXTLENGTH).toBe('textLength');
        expect(DataValidation.TYPE_TIME).toBe('time');
        expect(DataValidation.TYPE_WHOLE).toBe('whole');
    });

    it('should define all error style constants', () => {
        expect(DataValidation.STYLE_STOP).toBe('stop');
        expect(DataValidation.STYLE_WARNING).toBe('warning');
        expect(DataValidation.STYLE_INFORMATION).toBe('information');
    });

    it('should define all operator constants', () => {
        expect(DataValidation.OPERATOR_BETWEEN).toBe('between');
        expect(DataValidation.OPERATOR_EQUAL).toBe('equal');
        expect(DataValidation.OPERATOR_GREATERTHAN).toBe('greaterThan');
        expect(DataValidation.OPERATOR_GREATERTHANOREQUAL).toBe('greaterThanOrEqual');
        expect(DataValidation.OPERATOR_LESSTHAN).toBe('lessThan');
        expect(DataValidation.OPERATOR_LESSTHANOREQUAL).toBe('lessThanOrEqual');
        expect(DataValidation.OPERATOR_NOTBETWEEN).toBe('notBetween');
        expect(DataValidation.OPERATOR_NOTEQUAL).toBe('notEqual');
    });
});

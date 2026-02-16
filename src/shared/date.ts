const ISO_TIME_ONLY_REGEX = /^\s*\d?\d:\d\d(:\d\d([.]\d+)?)?\s*(am|pm)?\s*$/i;

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dateTimeToExcel = (date: Date): number => (date.getTime() - EXCEL_EPOCH_UTC) / MS_PER_DAY;

export const convertIsoDate = (value: unknown): number => {
    if (typeof value !== 'string') {
        throw new Error('Non-string value supplied for Iso Date conversion');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid string ${value} supplied for datatype Date`);
    }

    let newValue = dateTimeToExcel(date);
    if (ISO_TIME_ONLY_REGEX.test(value)) {
        newValue = newValue - Math.floor(newValue);
    }

    return newValue;
};

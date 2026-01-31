# PHP vs TS Parity Map: Style

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Style/Alignment.php` | `class Alignment` | `src/style/alignment.ts` | `class Alignment` | matched | src/style/alignment/alignment.ts<br>src/style/alignment.ts |
| `php-src/src/PhpSpreadsheet/Style/Border.php` | `class Border` | `src/style/border.ts` | `class Border` | matched | src/style/border/border.ts<br>src/style/border.ts |
| `php-src/src/PhpSpreadsheet/Style/Borders.php` | `class Borders` | `src/style/borders.ts` | `class Borders` | matched | src/style/borders/borders.ts<br>src/style/borders.ts |
| `php-src/src/PhpSpreadsheet/Style/Color.php` | `class Color` | `src/style/color.ts` | `class Color` | matched | src/style/color/color.ts<br>src/style/color.ts |
| `php-src/src/PhpSpreadsheet/Style/Conditional.php` | `class Conditional` | `src/style/conditional.ts` | `class Conditional` | matched | src/style/conditional/conditional.ts<br>src/style/conditional.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/CellMatcher.php` | `class CellMatcher` |  |  | missing | src/style/conditional-formatting/cell-matcher/cell-matcher.ts<br>src/style/cell-matcher.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/CellStyleAssessor.php` | `class CellStyleAssessor` |  |  | missing | src/style/conditional-formatting/cell-style-assessor/cell-style-assessor.ts<br>src/style/cell-style-assessor.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalColorScale.php` | `class ConditionalColorScale` |  |  | missing | src/style/conditional-formatting/conditional-color-scale/conditional-color-scale.ts<br>src/style/conditional-color-scale.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalDataBar.php` | `class ConditionalDataBar` |  |  | missing | src/style/conditional-formatting/conditional-data-bar/conditional-data-bar.ts<br>src/style/conditional-data-bar.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalDataBarExtension.php` | `class ConditionalDataBarExtension` |  |  | missing | src/style/conditional-formatting/conditional-data-bar-extension/conditional-data-bar-extension.ts<br>src/style/conditional-data-bar-extension.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalFormattingRuleExtension.php` | `class ConditionalFormattingRuleExtension` |  |  | missing | src/style/conditional-formatting/conditional-formatting-rule-extension/conditional-formatting-rule-extension.ts<br>src/style/conditional-formatting-rule-extension.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalFormatValueObject.php` | `class ConditionalFormatValueObject` |  |  | missing | src/style/conditional-formatting/conditional-format-value-object/conditional-format-value-object.ts<br>src/style/conditional-format-value-object.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalIconSet.php` | `class ConditionalIconSet` |  |  | missing | src/style/conditional-formatting/conditional-icon-set/conditional-icon-set.ts<br>src/style/conditional-icon-set.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/IconSetValues.php` |  |  |  | missing | src/style/conditional-formatting/icon-set-values/icon-set-values.ts<br>src/style/icon-set-values.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/MergedCellStyle.php` | `class MergedCellStyle` |  |  | missing | src/style/conditional-formatting/merged-cell-style/merged-cell-style.ts<br>src/style/merged-cell-style.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/StyleMerger.php` | `class StyleMerger` |  |  | missing | src/style/conditional-formatting/style-merger/style-merger.ts<br>src/style/style-merger.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard.php` | `class Wizard` |  |  | missing | src/style/conditional-formatting/wizard/wizard.ts<br>src/style/wizard.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/Blanks.php` | `class Blanks` |  |  | missing | src/style/conditional-formatting/wizard/blanks/blanks.ts<br>src/style/blanks.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/CellValue.php` | `class CellValue` |  |  | missing | src/style/conditional-formatting/wizard/cell-value/cell-value.ts<br>src/style/cell-value.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/DateValue.php` | `class DateValue` |  |  | missing | src/style/conditional-formatting/wizard/date-value/date-value.ts<br>src/style/date-value.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/Duplicates.php` | `class Duplicates` |  |  | missing | src/style/conditional-formatting/wizard/duplicates/duplicates.ts<br>src/style/duplicates.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/Errors.php` | `class Errors` |  |  | missing | src/style/conditional-formatting/wizard/errors/errors.ts<br>src/style/errors.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/Expression.php` | `class Expression` |  |  | missing | src/style/conditional-formatting/wizard/expression/expression.ts<br>src/style/expression.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/TextValue.php` | `class TextValue` |  |  | missing | src/style/conditional-formatting/wizard/text-value/text-value.ts<br>src/style/text-value.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/WizardAbstract.php` | `class WizardAbstract` |  |  | missing | src/style/conditional-formatting/wizard/wizard-abstract/wizard-abstract.ts<br>src/style/wizard-abstract.ts |
| `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/WizardInterface.php` | `interface WizardInterface` |  |  | missing | src/style/conditional-formatting/wizard/wizard-interface/wizard-interface.ts<br>src/style/wizard-interface.ts |
| `php-src/src/PhpSpreadsheet/Style/Fill.php` | `class Fill` | `src/style/fill.ts` | `class Fill` | matched | src/style/fill/fill.ts<br>src/style/fill.ts |
| `php-src/src/PhpSpreadsheet/Style/Font.php` | `class Font` | `src/style/font.ts` | `class Font` | matched | src/style/font/font.ts<br>src/style/font.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat.php` | `class NumberFormat` | `src/style/number-format.ts` | `class NumberFormat` | matched | src/style/number-format/number-format.ts<br>src/style/number-format.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/BaseFormatter.php` | `class BaseFormatter` |  |  | missing | src/style/number-format/base-formatter/base-formatter.ts<br>src/style/base-formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/DateFormatter.php` | `class DateFormatter` |  |  | missing | src/style/number-format/date-formatter/date-formatter.ts<br>src/style/date-formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Formatter.php` | `class Formatter` |  |  | missing | src/style/number-format/formatter/formatter.ts<br>src/style/formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/FractionFormatter.php` | `class FractionFormatter` |  |  | missing | src/style/number-format/fraction-formatter/fraction-formatter.ts<br>src/style/fraction-formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/NumberFormatter.php` | `class NumberFormatter` | `src/style/number-formatter.ts` | `class NumberFormatter` | matched | src/style/number-format/number-formatter/number-formatter.ts<br>src/style/number-formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/PercentageFormatter.php` | `class PercentageFormatter` |  |  | missing | src/style/number-format/percentage-formatter/percentage-formatter.ts<br>src/style/percentage-formatter.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Accounting.php` | `class Accounting` |  |  | missing | src/style/number-format/wizard/accounting/accounting.ts<br>src/style/accounting.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Currency.php` | `class Currency` |  |  | missing | src/style/number-format/wizard/currency/currency.ts<br>src/style/currency.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/CurrencyBase.php` | `class CurrencyBase` |  |  | missing | src/style/number-format/wizard/currency-base/currency-base.ts<br>src/style/currency-base.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/CurrencyNegative.php` |  |  |  | missing | src/style/number-format/wizard/currency-negative/currency-negative.ts<br>src/style/currency-negative.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Date.php` | `class Date` |  |  | missing | src/style/number-format/wizard/date/date.ts<br>src/style/date.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/DateTime.php` | `class DateTime` |  |  | missing | src/style/number-format/wizard/date-time/date-time.ts<br>src/style/date-time.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/DateTimeWizard.php` | `class DateTimeWizard` |  |  | missing | src/style/number-format/wizard/date-time-wizard/date-time-wizard.ts<br>src/style/date-time-wizard.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Duration.php` | `class Duration` |  |  | missing | src/style/number-format/wizard/duration/duration.ts<br>src/style/duration.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Locale.php` |  |  |  | missing | src/style/number-format/wizard/locale/locale.ts<br>src/style/locale.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Number.php` | `class Number` |  |  | missing | src/style/number-format/wizard/number/number.ts<br>src/style/number.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/NumberBase.php` | `class NumberBase` |  |  | missing | src/style/number-format/wizard/number-base/number-base.ts<br>src/style/number-base.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Percentage.php` | `class Percentage` |  |  | missing | src/style/number-format/wizard/percentage/percentage.ts<br>src/style/percentage.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Scientific.php` | `class Scientific` |  |  | missing | src/style/number-format/wizard/scientific/scientific.ts<br>src/style/scientific.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Time.php` | `class Time` |  |  | missing | src/style/number-format/wizard/time/time.ts<br>src/style/time.ts |
| `php-src/src/PhpSpreadsheet/Style/NumberFormat/Wizard/Wizard.php` | `interface Wizard` |  |  | missing | src/style/number-format/wizard/wizard/wizard.ts<br>src/style/wizard.ts |
| `php-src/src/PhpSpreadsheet/Style/Protection.php` | `class Protection` | `src/style/protection.ts` | `class Protection` | matched | src/style/protection/protection.ts<br>src/style/protection.ts |
| `php-src/src/PhpSpreadsheet/Style/RgbTint.php` | `class RgbTint` | `src/style/rgb-tint.ts` | `class RgbTint` | matched | src/style/rgb-tint/rgb-tint.ts<br>src/style/rgb-tint.ts |
| `php-src/src/PhpSpreadsheet/Style/Style.php` | `class Style` | `src/style/style.ts` | `class Style` | matched | src/style/style/style.ts<br>src/style/style.ts |
| `php-src/src/PhpSpreadsheet/Style/Supervisor.php` | `class Supervisor` | `src/style/supervisor.ts` |  | matched | src/style/supervisor/supervisor.ts<br>src/style/supervisor.ts |

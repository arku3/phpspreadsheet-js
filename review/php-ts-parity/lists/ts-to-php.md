# TS -> PHP Coverage (Heuristic)

For each TypeScript file, list PHP files that mapped to it under the heuristic. This is especially useful where TS consolidates many PHP classes/functions into one file (notably Calculation).

## `src/calculation/calculation.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`

## `src/calculation/engine/branch-pruner.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Engine/BranchPruner.php`

## `src/calculation/engine/structured-reference.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Engine/Operands/StructuredReference.php`

## `src/calculation/formula-parser.ts`

- `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php`

## `src/calculation/formula-token.ts`

- `php-src/src/PhpSpreadsheet/Calculation/FormulaToken.php`

## `src/calculation/functions/database.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Database/DatabaseAbstract.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DAverage.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DCount.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DCountA.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DGet.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DMax.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DMin.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DProduct.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DStDev.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DStDevP.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DSum.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DVar.php`
- `php-src/src/PhpSpreadsheet/Calculation/Database/DVarP.php`

## `src/calculation/functions/datetime.ts`

- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Constants.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Current.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Date.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/DateParts.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/DateValue.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Days.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Days360.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Difference.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Helpers.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Month.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/NetworkDays.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Time.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/TimeParts.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/TimeValue.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/Week.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/WorkDay.php`
- `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/YearFrac.php`

## `src/calculation/functions/engineering.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Engineering/BesselI.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/BesselJ.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/BesselK.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/BesselY.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/BitWise.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/Compare.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/Complex.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ComplexFunctions.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ComplexOperations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/Constants.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertBinary.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertDecimal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertHex.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertOctal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ConvertUOM.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/EngineeringValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/Erf.php`
- `php-src/src/PhpSpreadsheet/Calculation/Engineering/ErfC.php`

## `src/calculation/functions/financial.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Financial/Amortization.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/CashFlowValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Constant/Periodic.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Constant/Periodic/Cumulative.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Constant/Periodic/Interest.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Constant/Periodic/InterestAndPrincipal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Constant/Periodic/Payments.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Single.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Variable/NonPeriodic.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/CashFlow/Variable/Periodic.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Constants.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Coupons.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Depreciation.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Dollar.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/FinancialValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Helpers.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/InterestRate.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Securities/AccruedInterest.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Securities/Price.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Securities/Rates.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Securities/SecurityValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/Securities/Yields.php`
- `php-src/src/PhpSpreadsheet/Calculation/Financial/TreasuryBill.php`

## `src/calculation/functions/logical.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Logical/Boolean.php`
- `php-src/src/PhpSpreadsheet/Calculation/Logical/Conditional.php`
- `php-src/src/PhpSpreadsheet/Calculation/Logical/Operations.php`

## `src/calculation/functions/lookup-ref.ts`

- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Address.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/ChooseRowsEtc.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/ExcelMatch.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Filter.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Formula.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Helpers.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/HLookup.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Hstack.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Hyperlink.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Indirect.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Lookup.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/LookupBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/LookupRefValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Matrix.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Offset.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/RowColumnInformation.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Selection.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Sort.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/TorowTocol.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Unique.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/VLookup.php`
- `php-src/src/PhpSpreadsheet/Calculation/LookupRef/Vstack.php`

## `src/calculation/functions/math-trig.ts`

- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Absolute.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Angle.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Arabic.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Base.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Ceiling.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Combinations.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Exp.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Factorial.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Floor.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Gcd.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Helpers.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/IntClass.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Lcm.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Logarithms.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/MatrixFunctions.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Operations.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Random.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Roman.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Round.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/SeriesSum.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Sign.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Sqrt.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Subtotal.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Sum.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/SumSquares.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Cosecant.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Cosine.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Cotangent.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Secant.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Sine.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trig/Tangent.php`
- `php-src/src/PhpSpreadsheet/Calculation/MathTrig/Trunc.php`

## `src/calculation/functions/statistical.ts`

- `php-src/src/PhpSpreadsheet/Calculation/Statistical/AggregateBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Averages.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Averages/Mean.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Conditional.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Confidence.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Counts.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Deviations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Beta.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Binomial.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/ChiSquared.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/DistributionValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Exponential.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/F.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Fisher.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Gamma.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/GammaBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/HyperGeometric.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/LogNormal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/NewtonRaphson.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Normal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Poisson.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/StandardNormal.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/StudentT.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Distributions/Weibull.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Maximum.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/MaxMinBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Minimum.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Percentiles.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Permutations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Size.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/StandardDeviations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Standardize.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/StatisticalValidations.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Trends.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/VarianceBase.php`
- `php-src/src/PhpSpreadsheet/Calculation/Statistical/Variances.php`

## `src/calculation/functions/text-data.ts`

- `php-src/src/PhpSpreadsheet/Calculation/TextData/CaseConvert.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/CharacterConvert.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Concatenate.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Extract.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Format.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Helpers.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Replace.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Search.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Text.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Thai.php`
- `php-src/src/PhpSpreadsheet/Calculation/TextData/Trim.php`

## `src/common/hash-table.ts`

- `php-src/src/PhpSpreadsheet/HashTable.php`

## `src/core/advanced-value-binder.ts`

- `php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php`

## `src/core/cell-collection.ts`

- `php-src/src/PhpSpreadsheet/Collection/Cells.php`

## `src/core/cell.ts`

- `php-src/src/PhpSpreadsheet/Cell/Cell.php`

## `src/core/comment.ts`

- `php-src/src/PhpSpreadsheet/Comment.php`

## `src/core/data-validation.ts`

- `php-src/src/PhpSpreadsheet/Cell/DataValidation.php`

## `src/core/default-value-binder.ts`

- `php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php`

## `src/core/defined-name.ts`

- `php-src/src/PhpSpreadsheet/DefinedName.php`

## `src/core/hyperlink.ts`

- `php-src/src/PhpSpreadsheet/Cell/Hyperlink.php`

## `src/core/i-value-binder.ts`

- `php-src/src/PhpSpreadsheet/Cell/IValueBinder.php`

## `src/core/named-range.ts`

- `php-src/src/PhpSpreadsheet/NamedRange.php`

## `src/core/spreadsheet.ts`

- `php-src/src/PhpSpreadsheet/Spreadsheet.php`

## `src/core/worksheet.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`

## `src/document/properties.ts`

- `php-src/src/PhpSpreadsheet/Document/Properties.php`

## `src/document/security.ts`

- `php-src/src/PhpSpreadsheet/Document/Security.php`

## `src/io/i-reader.ts`

- `php-src/src/PhpSpreadsheet/Reader/IReader.php`

## `src/io/i-writer.ts`

- `php-src/src/PhpSpreadsheet/Writer/IWriter.php`

## `src/io/xlsx-reader.ts`

- `php-src/src/PhpSpreadsheet/Reader/Xlsx.php`

## `src/io/xlsx-writer.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx.php`

## `src/io/xlsx/comments.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/Comments.php`

## `src/io/xlsx/content-types.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/ContentTypes.php`

## `src/io/xlsx/doc-props.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/DocProps.php`

## `src/io/xlsx/rels.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/Rels.php`

## `src/io/xlsx/string-table.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/StringTable.php`

## `src/io/xlsx/styles.ts`

- `php-src/src/PhpSpreadsheet/Reader/Xlsx/Styles.php`

## `src/io/xlsx/theme.ts`

- `php-src/src/PhpSpreadsheet/Reader/Xlsx/Theme.php`
- `php-src/src/PhpSpreadsheet/Writer/Xlsx/Theme.php`

## `src/io/xlsx/workbook.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/Workbook.php`

## `src/io/xlsx/worksheet.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/Worksheet.php`

## `src/io/xlsx/writer-part.ts`

- `php-src/src/PhpSpreadsheet/Writer/Xlsx/WriterPart.php`

## `src/rich-text/i-text-element.ts`

- `php-src/src/PhpSpreadsheet/RichText/ITextElement.php`

## `src/rich-text/rich-text.ts`

- `php-src/src/PhpSpreadsheet/RichText/RichText.php`

## `src/rich-text/run.ts`

- `php-src/src/PhpSpreadsheet/RichText/Run.php`

## `src/rich-text/text-element.ts`

- `php-src/src/PhpSpreadsheet/RichText/TextElement.php`

## `src/shared/password-hasher.ts`

- `php-src/src/PhpSpreadsheet/Shared/PasswordHasher.php`

## `src/style/alignment.ts`

- `php-src/src/PhpSpreadsheet/Style/Alignment.php`

## `src/style/border.ts`

- `php-src/src/PhpSpreadsheet/Style/Border.php`

## `src/style/borders.ts`

- `php-src/src/PhpSpreadsheet/Style/Borders.php`

## `src/style/color.ts`

- `php-src/src/PhpSpreadsheet/Style/Color.php`

## `src/style/conditional.ts`

- `php-src/src/PhpSpreadsheet/Style/Conditional.php`

## `src/style/fill.ts`

- `php-src/src/PhpSpreadsheet/Style/Fill.php`

## `src/style/font.ts`

- `php-src/src/PhpSpreadsheet/Style/Font.php`

## `src/style/number-format.ts`

- `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`

## `src/style/number-formatter.ts`

- `php-src/src/PhpSpreadsheet/Style/NumberFormat/NumberFormatter.php`

## `src/style/protection.ts`

- `php-src/src/PhpSpreadsheet/Style/Protection.php`

## `src/style/rgb-tint.ts`

- `php-src/src/PhpSpreadsheet/Style/RgbTint.php`

## `src/style/style.ts`

- `php-src/src/PhpSpreadsheet/Style/Style.php`

## `src/style/supervisor.ts`

- `php-src/src/PhpSpreadsheet/Style/Supervisor.php`

## `src/style/theme.ts`

- `php-src/src/PhpSpreadsheet/Theme.php`

## `src/utils/coordinate.ts`

- `php-src/src/PhpSpreadsheet/Cell/Coordinate.php`

## `src/utils/string-helper.ts`

- `php-src/src/PhpSpreadsheet/Shared/StringHelper.php`

## `src/worksheet/auto-filter.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/AutoFilter.php`

## `src/worksheet/chart/chart.ts`

- `php-src/src/PhpSpreadsheet/Chart/Chart.php`

## `src/worksheet/column-dimension.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/ColumnDimension.php`

## `src/worksheet/dimension.ts`

- `php-src/src/PhpSpreadsheet/Helper/Dimension.php`
- `php-src/src/PhpSpreadsheet/Worksheet/Dimension.php`

## `src/worksheet/drawing/drawing.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/Drawing.php`

## `src/worksheet/page-margins.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/PageMargins.php`

## `src/worksheet/page-setup.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/PageSetup.php`

## `src/worksheet/pane.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/Pane.php`

## `src/worksheet/row-dimension.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/RowDimension.php`

## `src/worksheet/sheet-view.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/SheetView.php`

## `src/worksheet/table.ts`

- `php-src/src/PhpSpreadsheet/Worksheet/Table.php`

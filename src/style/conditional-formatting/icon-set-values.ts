/**
 * Icon Set Values.
 */
export const IconSetValues = {
    ThreeArrows: '3Arrows',
    ThreeArrowsGray: '3ArrowsGray',
    ThreeFlags: '3Flags',
    ThreeTrafficLights1: '3TrafficLights1',
    ThreeTrafficLights2: '3TrafficLights2',
    ThreeSigns: '3Signs',
    ThreeSymbols: '3Symbols',
    ThreeSymbols2: '3Symbols2',
    FourArrows: '4Arrows',
    FourArrowsGray: '4ArrowsGray',
    FourRedToBlack: '4RedToBlack',
    FourRating: '4Rating',
    FourTrafficLights: '4TrafficLights',
    FiveArrows: '5Arrows',
    FiveArrowsGray: '5ArrowsGray',
    FiveRating: '5Rating',
    FiveQuarters: '5Quarters',
} as const;

export type IconSetValues = (typeof IconSetValues)[keyof typeof IconSetValues];

export type ColorGroup = {
  label: string;
  shades: string[];
};

export const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'Green',
    shades: ['#6aab8a', '#5e8c6a', '#7a9e7e', '#4a7c6f', '#7ab89a'],
  },
  {
    label: 'Blue',
    shades: ['#7a9fd0', '#6b8fba', '#5a7aaa', '#4a6fa0', '#8aaac8'],
  },
  {
    label: 'Teal',
    shades: ['#6ab0b8', '#5a9ea8', '#4a8e98', '#7abac0', '#3a7e90'],
  },
  {
    label: 'Purple',
    shades: ['#9e80b8', '#8b6fa8', '#7a5e98', '#6a4e88', '#b090c8'],
  },
  {
    label: 'Pink',
    shades: ['#c07888', '#b06b7a', '#d08898', '#985868', '#a87888'],
  },
  {
    label: 'Red',
    shades: ['#c08070', '#b07060', '#a06050', '#987060', '#c89080'],
  },
  {
    label: 'Orange',
    shades: ['#c49a6a', '#b8895a', '#d4a870', '#a07848', '#b89870'],
  },
  {
    label: 'Yellow',
    shades: ['#b8a060', '#a89050', '#988040', '#c8b070', '#887030'],
  },
  {
    label: 'Slate',
    shades: ['#8a9faa', '#7a8f9a', '#6a7f8a', '#5a6f7a', '#9aafba'],
  },
  {
    label: 'Brown',
    shades: ['#9a8070', '#8a7060', '#aa9080', '#7a6050', '#6a5040'],
  },
  {
    label: 'Mauve',
    shades: ['#aa8aaa', '#9a7a9a', '#8a6a8a', '#ba9aba', '#7a5a7a'],
  },
  {
    label: 'Sage',
    shades: ['#8aaa8a', '#7a9a7a', '#6a8a6a', '#9aba9a', '#5a7a5a'],
  },
];

export const PRESET_COLORS: (string | null)[] = [
  null,
  ...COLOR_GROUPS.flatMap((g) => g.shades),
];

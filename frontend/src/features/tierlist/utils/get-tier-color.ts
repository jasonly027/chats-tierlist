const colors = [
  '#ff7f7e',
  '#ffbf7f',
  '#ffdf80',
  '#feff7f',
  '#beff7f',
  '#7eff80',
  '#7fffff',
  '#7fbfff',
];

export function getTierColor(tierIdx: number) {
  return colors[tierIdx % 8];
}

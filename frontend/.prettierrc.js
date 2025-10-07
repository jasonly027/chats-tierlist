// @ts-check
import parent from '../.prettierrc.js';

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  ...parent,
  plugins: ["prettier-plugin-tailwindcss"]
};

export default config;

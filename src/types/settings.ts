import type { CsvDefaults } from "./csv";

export type AppSettings = {
  /** Text between handle and number: "" -> red-ring1, "-" -> red-ring-1 */
  nameSeparator: string;
  startNumber: number;
  /** Put each product in its own folder inside the ZIP. */
  zipFolderPerProduct: boolean;
  csv: CsvDefaults;
};
